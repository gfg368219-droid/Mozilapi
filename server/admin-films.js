import { approvedPosterUrl, approvedWatchLink } from '../shared/official-links.js';

const MAX_FILE_BYTES = 1_000_000;
const MAX_FILMS = 100;

function splitFilmBlocks(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const blocks = [];
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    if (/^━{8,}\s*$/.test(lines[index]) && /^━{8,}\s*$/.test(lines[index + 2] || '')) {
      if (current) blocks.push(current);
      current = { title: lines[index + 1].trim(), lines: [] };
      index += 2;
      continue;
    }
    if (/^={8,}\s*$/.test(lines[index])) {
      if (current) {
        blocks.push(current);
        current = null;
        break;
      }
      continue;
    }
    if (current) current.lines.push(lines[index]);
  }
  if (current) blocks.push(current);
  return blocks;
}

function fieldValue(lines, name) {
  const match = lines.find((line) => new RegExp(`^\\s*${name}\\s*:`, 'i').test(line));
  return match ? match.replace(new RegExp(`^\\s*${name}\\s*:\\s*`, 'i'), '').trim() : '';
}

function readDescription(lines) {
  const first = lines.findIndex((line) => /^\s*Description\s*:/i.test(line));
  if (first < 0) return '';
  const text = [lines[first].replace(/^\s*Description\s*:\s*/i, '')];
  for (const line of lines.slice(first + 1)) {
    if (/^\s*(?:Avec\b|Durée\s*:|Sortie\s*:|Lien image\s*:|Lien officiel\s*:|Lien légal\s*:|Plateforme\s*:|Lecteur\b|[─━]{5,})/i.test(line)) break;
    if (!line.trim()) break;
    text.push(line.trim());
  }
  return text.join(' ').replace(/\s+/g, ' ').slice(0, 3000);
}

export function parseFilmImport(text) {
  if (typeof text !== 'string' || !text.trim()) {
    const error = new Error('Le fichier est vide ou illisible.');
    error.statusCode = 400;
    throw error;
  }
  if (Buffer.byteLength(text, 'utf8') > MAX_FILE_BYTES) {
    const error = new Error('Le fichier dépasse la limite de 1 Mo.');
    error.statusCode = 413;
    throw error;
  }

  const blocks = splitFilmBlocks(text);
  if (!blocks.length || blocks.length > MAX_FILMS) {
    const error = new Error(`Le fichier doit contenir de 1 à ${MAX_FILMS} fiches au format films.txt.`);
    error.statusCode = 400;
    throw error;
  }

  const films = [];
  const rejected = [];
  let ignoredPlayerLinks = 0;
  let ignoredUnapprovedLinks = 0;

  for (const block of blocks) {
    const tmdbId = fieldValue(block.lines, 'TMDB ID').match(/^\d{1,12}$/)?.[0];
    const titleWithYear = block.title.trim().slice(0, 240);
    const year = Number(titleWithYear.match(/\(((?:19|20)\d{2})\)\s*$/)?.[1]) || null;
    const title = titleWithYear.replace(/\s+\(((?:19|20)\d{2})\)\s*$/, '').trim();
    if (!tmdbId || !title) {
      rejected.push({ title: title || 'Fiche inconnue', reason: 'Titre ou identifiant TMDb invalide.' });
      continue;
    }

    const officialLinks = [];
    for (const line of block.lines) {
      if (/^\s*Lecteur\b/i.test(line)) {
        ignoredPlayerLinks += 1;
        continue;
      }
      const match = line.match(/^\s*(?:Lien officiel|Lien légal|Plateforme)\s*:\s*(https:\/\/\S+)/i);
      if (!match) continue;
      const link = approvedWatchLink(match[1].replace(/[),.]+$/, ''));
      if (!link) {
        ignoredUnapprovedLinks += 1;
        continue;
      }
      if (!officialLinks.some((existing) => existing.url === link.url)) officialLinks.push(link);
    }

    if (!officialLinks.length) {
      rejected.push({ title, reason: 'Aucun lien HTTPS d’une plateforme autorisée.' });
      continue;
    }

    const posterLine = block.lines.findIndex((line) => /^\s*Lien image\s*:/i.test(line));
    const posterCandidate = posterLine >= 0
      ? block.lines[posterLine].replace(/^\s*Lien image\s*:\s*/i, '').trim() || block.lines[posterLine + 1]?.trim() || ''
      : '';
    const poster = approvedPosterUrl(posterCandidate);

    films.push({
      tmdbId,
      title,
      year,
      description: readDescription(block.lines),
      poster,
      officialLinks
    });
  }

  const uniqueFilms = [...new Map(films.map((film) => [film.tmdbId, film])).values()];
  return { films: uniqueFilms, rejected, ignoredPlayerLinks, ignoredUnapprovedLinks };
}
