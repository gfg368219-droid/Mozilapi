import { handleApiRequest } from '../server/api.js';
import { handleAnimeSamaRequest } from '../server/anime-sama-api.js';

const sendJson = (response, status, payload) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
};

const restoreApiPath = (request) => {
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || '/', `https://${host}`);
  if (!['/api/router', '/api'].includes(url.pathname)) return;

  const route = url.searchParams.get('route');
  if (!route) return;

  const params = new URLSearchParams(url.searchParams);
  params.delete('route');
  const query = params.toString();
  request.url = `/api/${route}${query ? `?${query}` : ''}`;
};

export default async function handler(request, response) {
  try {
    restoreApiPath(request);
    if (await handleApiRequest(request, response)) return;
    if (await handleAnimeSamaRequest(request, response)) return;
    sendJson(response, 404, { error: 'Route API introuvable.' });
  } catch (error) {
    console.error('[vercel-api]', error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: 'Erreur interne de l’API.' });
    }
  }
}
