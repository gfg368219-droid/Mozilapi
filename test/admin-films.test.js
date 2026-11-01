import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFilmImport } from '../server/admin-films.js';
import { approvedWatchLink } from '../shared/official-links.js';

const border = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

function filmBlock({ title = 'Film autorisé (2024)', link = 'https://www.netflix.com/title/123' } = {}) {
  return [
    border,
    title,
    border,
    'TMDB ID: 12345',
    'Description: Résumé du film.',
    'Lien image:',
    '  https://image.tmdb.org/t/p/w500/poster.jpg',
    `Lien officiel: ${link}`,
    '',
    '============================================================================='
  ].join('\n');
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
