import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowRight, Code2, ExternalLink, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';

export default function PublicApiDocs({ onCreateKey, onLogin }) {
  const [docs, setDocs] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const [docsResponse, healthResponse] = await Promise.all([
        fetch('/api/docs', { cache: 'no-store' }),
        fetch('/api/health', { cache: 'no-store' })
      ]);
      const [payload, health] = await Promise.all([docsResponse.json(), healthResponse.json()]);
      if (!docsResponse.ok) throw new Error(payload.error || 'La documentation est indisponible.');
      if (!healthResponse.ok || health.status !== 'ok') throw new Error('Le service API ne répond pas correctement.');
      setDocs(payload);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.message || 'Impossible de charger la documentation.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return <div className="page api-page public-api-page">
    <section className="public-api-hero">
      <div className="api-heading">
        <span className="eyebrow"><Code2 size={14} /> API MOZANIM / DOCUMENTATION PUBLIQUE</span>
        <h1>Le catalogue,<br /><em>dans vos projets.</em></h1>
        <p>Parcourez les œuvres avec une clé API. La documentation est ouverte à tous; les clés restent protégées et limitées aux droits choisis.</p>
        <div className="public-api-actions">
          <button className="button primary" onClick={onCreateKey}><KeyRound size={15} /> Créer une clé API <ArrowRight size={14} /></button>
          <button className="button" onClick={onLogin}>Se connecter</button>
          <a className="api-json-link" href="/api/docs" target="_blank" rel="noreferrer">JSON <ExternalLink size={13} /></a>
        </div>
      </div>
      <div className={`api-status ${status === 'ready' ? 'online' : status}`} role="status">
        <Activity size={17} />
        <div><strong>{status === 'ready' ? 'API en ligne' : status === 'error' ? 'API indisponible' : 'Vérification de l’API'}</strong><span>{status === 'ready' ? 'La documentation répond.' : status === 'error' ? error : 'Connexion au service…'}</span></div>
        {status === 'error' && <button className="icon-button" onClick={load} aria-label="Réessayer"><RefreshCw size={15} /></button>}
      </div>
    </section>

    <div className="api-notice"><span className="notice-shield"><ShieldCheck size={15} /></span><span>Les requêtes de lecture et d’écriture utilisent une clé API. Ne placez jamais une clé secrète dans le code envoyé au navigateur.</span></div>

    <section className="public-api-section">
      <div className="section-heading"><div><span className="eyebrow">RÉFÉRENCE</span><h2>Endpoints</h2></div><span className="section-count">{docs?.rateLimit || '120 requêtes par minute et par clé'}</span></div>
      {status === 'loading' && <div className="docs-loading"><span /><span /><span /></div>}
      {status === 'error' && <div className="error-panel">{error}<button className="button small" onClick={load}><RefreshCw size={13} /> Réessayer</button></div>}
      {docs?.endpoints && <div className="public-endpoint-list">{docs.endpoints.map((endpoint) => (
        <article className="public-endpoint" key={`${endpoint.method}-${endpoint.path}`}>
          <div className="public-endpoint-main"><span className={`method ${String(endpoint.method).toLowerCase()}`}>{endpoint.method}</span><code>{endpoint.path}</code><p>{endpoint.description}</p></div>
          <span className={`endpoint-auth ${endpoint.scope === 'public' ? 'public' : ''}`}>{endpoint.auth || endpoint.scope}</span>
        </article>
      ))}</div>}
    </section>

    <section className="public-api-section">
      <div className="section-heading"><div><span className="eyebrow">EXEMPLE</span><h2>Lire le catalogue</h2></div></div>
      <p className="docs-intro">Remplacez <code>VOTRE_CLE_API</code> par une clé de lecture créée dans votre espace.</p>
      <pre className="api-code"><code>{`curl -H "Authorization: Bearer VOTRE_CLE_API" \\\n  "https://VOTRE_DOMAINE/api/v1/works?kind=anime&page=1&limit=20"`}</code></pre>
      <pre className="api-code"><code>{`// Endpoint public : aucune clé requise\nconst response = await fetch("https://VOTRE_DOMAINE/api/docs");\nif (!response.ok) throw new Error("Documentation indisponible");\nconst documentation = await response.json();`}</code></pre>
      <div className="public-api-footer"><span>Version {docs?.version || '—'} · Limite appliquée par clé</span><button className="button small" onClick={onCreateKey}>Obtenir une clé <ArrowRight size={13} /></button></div>
    </section>
  </div>;
}
