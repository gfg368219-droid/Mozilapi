const providers = [
  { name: 'Netflix', domains: ['netflix.com'] },
  { name: 'Prime Video', domains: ['primevideo.com'] },
  { name: 'Disney+', domains: ['disneyplus.com'] },
  { name: 'Apple TV', domains: ['tv.apple.com'] },
  { name: 'Max', domains: ['max.com'] },
  { name: 'Paramount+', domains: ['paramountplus.com'] },
  { name: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
  { name: 'Internet Archive', domains: ['archive.org'] },
  { name: 'ARTE', domains: ['arte.tv'] },
  { name: 'France.tv', domains: ['france.tv'] },
  { name: 'MUBI', domains: ['mubi.com'] },
  { name: 'Pluto TV', domains: ['pluto.tv'] },
  { name: 'Tubi', domains: ['tubi.tv'] },
  { name: 'Rakuten TV', domains: ['rakuten.tv'] },
  { name: 'CANAL+', domains: ['canalplus.com'] },
  { name: 'Google Play', domains: ['play.google.com'] }
];

const hostMatches = (hostname, domain) => hostname === domain || hostname.endsWith(`.${domain}`);

export function approvedWatchLink(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const provider = providers.find((entry) =>
      entry.domains.some((domain) => hostMatches(url.hostname.toLowerCase(), domain))
    );
    return provider ? { provider: provider.name, url: url.href } : null;
  } catch {
    return null;
  }
}

export function approvedPosterUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'image.tmdb.org'
      ? url.href
      : '';
  } catch {
    return '';
  }
}
