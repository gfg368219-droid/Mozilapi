import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFilmImport } from '../server/admin-films.js';
import { approvedWatchLink } from '../shared/official-links.js';
import { MAX_FILM_IMPORT_BYTES, MAX_FILM_IMPORT_COUNT } from '../shared/film-import-constants.js';

const border = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

function filmBlock({ title = 'Film autorisé (2024)', link = 'https://www.netflix.com/title/123', id = 12345 } = {}) {
  return [
    border,
    title,
    border,
    `TMDB ID: ${id}`,
    'Description: Résumé du film.',
    'Lien image:',
    '  https://image.tmdb.org/t/p/w500/poster.jpg',
    `Lien officiel: ${link}`,
    '',
    '============================================================================='
  ].join('\n');
}

function filmCollection(count) {
  const blocks = Array.from({ length: count }, (_, index) => filmBlock({
    title: `Film ${index + 1} (2024)`,
    id: index + 1
  }).replace(/\n={8,}\s*$/, ''));
  return `${blocks.join('\n')}\n${'='.repeat(77)}`;
}

test('imports a film with an approved official platform link', () => {
  const parsed = parseFilmImport(filmBlock());
  assert.equal(parsed.films.length, 1);
  assert.equal(parsed.films[0].title, 'Film autorisé');
  assert.equal(parsed.films[0].year, 2024);
  assert.equal(parsed.films[0].officialLinks[0].provider, 'Netflix');
  assert.equal(parsed.films[0].poster, 'https://image.tmdb.org/t/p/w500/poster.jpg');
});

test('does not import reader embeds from third-party hosts', () => {
  const text = [
    border,
    'Film sans lien officiel (2024)',
    border,
    'TMDB ID: 98765',
    'Description: Résumé.',
    'Lecteur tiers:',
    '  https://unverified.example/embed/98765',
    '',
    '============================================================================='
  ].join('\n');
  const parsed = parseFilmImport(text);
  assert.equal(parsed.films.length, 0);
  assert.equal(parsed.ignoredPlayerLinks, 1);
});

test('rejects host spoofing and non-HTTPS platform links', () => {
  assert.equal(approvedWatchLink('https://netflix.com.attacker.example/watch/1'), null);
  assert.equal(approvedWatchLink('http://www.netflix.com/title/1'), null);
  assert.equal(parseFilmImport(filmBlock({ link: 'https://unverified.example/watch/1' })).films.length, 0);
});

test('accepts the increased import limit of 1000 films', () => {
  const parsed = parseFilmImport(filmCollection(MAX_FILM_IMPORT_COUNT));
  assert.equal(parsed.films.length, MAX_FILM_IMPORT_COUNT);
});

test('rejects film imports above the 1000-film limit', () => {
  assert.throws(
    () => parseFilmImport(filmCollection(MAX_FILM_IMPORT_COUNT + 1)),
    (error) => error.statusCode === 400
  );
});

test('rejects text files larger than the increased 10 MiB limit', () => {
  assert.throws(
    () => parseFilmImport('x'.repeat(MAX_FILM_IMPORT_BYTES + 1)),
    (error) => error.statusCode === 413
  );
});
