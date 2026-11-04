import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ExternalLink, FileUp, RefreshCw, ShieldCheck } from 'lucide-react';
import { MAX_FILM_IMPORT_BYTES, MAX_FILM_IMPORT_COUNT } from '../shared/film-import-constants.js';

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Erreur HTTP ${response.status}.`);
    error.payload = payload;
    throw error;
  }
  return payload;
}

export default function AdminPanel({ onImported }) {
  const fileInput = useRef(null);
  const importInFlight = useRef(false);
  const [films, setFilms] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const loadFilms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/films', { credentials: 'include', cache: 'no-store' });
      const payload = await readJson(response);
      setFilms(Array.isArray(payload.films) ? payload.films : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les films importés.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFilms(); }, [loadFilms]);

  const importFile = async (file, confirmed = rightsConfirmed) => {
    if (importInFlight.current) return;
    setError('');
    setResult(null);
    if (!file) {
      setError('Choisissez un fichier texte à importer.');
      return;
    }
    if (file.size > MAX_FILM_IMPORT_BYTES) {
      setError(`Le fichier dépasse la limite de ${Math.ceil(MAX_FILM_IMPORT_BYTES / (1024 * 1024))} Mo.`);
      return;
    }
    if (!confirmed) {
      setError('Confirmez que les liens ont une diffusion autorisée.');
      return;
    }

    importInFlight.current = true;
    setPending(true);
    try {
      const text = await file.text();
      const response = await fetch('/api/admin/films/import', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Rights-Confirmed': String(confirmed)
        },
        body: text
      });
      const payload = await readJson(response);
      setResult(payload);
      if (fileInput.current) fileInput.current.value = '';
      setSelectedFile(null);
      await loadFilms();
      onImported?.();
    } catch (importError) {
      setError(importError.message || 'Import impossible.');
      setResult(importError.payload || null);
    } finally {
      importInFlight.current = false;
      setPending(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.currentTarget.files?.[0] || null;
    setSelectedFile(file);
    setError('');
    setResult(null);
    if (file && rightsConfirmed) void importFile(file, true);
  };

  const handleRightsChange = (event) => {
    const confirmed = event.currentTarget.checked;
    setRightsConfirmed(confirmed);
    if (confirmed && selectedFile) void importFile(selectedFile, true);
  };

  return <section className="page admin-page">
    <header className="admin-page-heading">
      <div>
        <span className="eyebrow"><ShieldCheck size={14} /> ESPACE ADMINISTRATEUR</span>
        <h1>Gestion des films</h1>
        <p>Importez des fiches avec des liens de diffusion autorisés. Les lecteurs tiers et les liens d’intégration ne sont pas acceptés.</p>
      </div>
      <button className="button small" type="button" onClick={loadFilms} disabled={loading}><RefreshCw size={14} /> Actualiser</button>
    </header>

    <form className="admin-import-card" onSubmit={(event) => { event.preventDefault(); void importFile(selectedFile, rightsConfirmed); }}>
      <div className="admin-import-title"><FileUp size={18} /><div><strong>Importer un fichier films.txt</strong><span>TXT, {Math.ceil(MAX_FILM_IMPORT_BYTES / (1024 * 1024))} Mo et {MAX_FILM_IMPORT_COUNT.toLocaleString('fr-FR')} fiches maximum</span></div></div>
      <label className="admin-file-field">
        <span>Fichier catalogue</span>
        <input ref={fileInput} type="file" accept=".txt,text/plain" onChange={handleFileChange} />
      </label>
      <label className="admin-rights-confirmation">
        <input type="checkbox" checked={rightsConfirmed} onChange={handleRightsChange} />
        <span>Je confirme que les liens sont officiels ou que leur diffusion est autorisée.</span>
      </label>
      <p className="admin-format-help">L’ajout démarre automatiquement après sélection du fichier et confirmation des droits. Pour chaque film, ajoutez une ligne « Lien officiel: https://… ». Seules les plateformes approuvées sont conservées ; les URL de lecteurs ou d’iframes sont ignorées.</p>
      {error && <div className="admin-feedback error" role="alert"><AlertCircle size={16} />{error}</div>}
      {result && <div className={`admin-feedback ${result.imported ? 'success' : 'error'}`} role="status">
        {result.imported ? <Check size={16} /> : <AlertCircle size={16} />}
        <span>{result.imported ? `${result.imported} fiche${result.imported > 1 ? 's' : ''} importée${result.imported > 1 ? 's' : ''}.` : 'Aucune fiche importée.'}
          {(result.ignoredPlayerLinks || result.ignoredUnapprovedLinks) ? ` ${result.ignoredPlayerLinks || 0} lien(s) de lecteur et ${result.ignoredUnapprovedLinks || 0} lien(s) non autorisé(s) ignorés.` : ''}
        </span>
      </div>}
      <button className="button primary" type="submit" disabled={pending || !rightsConfirmed || !selectedFile}>
        <FileUp size={15} /> {pending ? 'Import en cours…' : 'Ajouter maintenant'}
      </button>
    </form>

    <section className="admin-film-list">
      <div className="admin-film-list-heading"><div><span className="eyebrow">CATALOGUE AUTORISÉ</span><h2>Films importés</h2></div><span>{films.length} fiche{films.length === 1 ? '' : 's'}</span></div>
      {loading ? <p className="admin-empty">Chargement des films…</p>
        : films.length ? <div className="admin-film-rows">{films.map((film) => <article className="admin-film-row" key={film.tmdbId}>
          {film.poster ? <img src={film.poster} alt="" loading="lazy" /> : <span className="admin-poster-placeholder">Film</span>}
          <div className="admin-film-row-copy"><strong>{film.title}{film.year ? ` (${film.year})` : ''}</strong><span>{(film.officialLinks || []).map((link) => link.provider).filter(Boolean).join(' · ') || 'Aucun lien officiel'}</span></div>
          <div className="admin-film-row-links">{(film.officialLinks || []).map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${link.provider || 'la plateforme'}`}><ExternalLink size={15} /></a>)}</div>
        </article>)}</div>
        : <p className="admin-empty">Aucun film importé. Les fiches doivent contenir au moins un lien officiel accepté.</p>}
    </section>
  </section>;
}
