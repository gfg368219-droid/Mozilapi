import { createHmac, timingSafeEqual } from 'node:crypto';

const keyIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9][a-z0-9-]{0,179}$/;

export function createEmbedToken(keyId, slug, secret) {
  if (!secret) throw new Error('SESSION_SECRET is required to create embed tokens.');
  if (!keyIdPattern.test(String(keyId)) || !slugPattern.test(String(slug))) {
    throw new Error('Invalid embed token scope.');
  }
  const payload = Buffer.from(JSON.stringify({ keyId, slug })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyEmbedToken(token, secret) {
  if (!secret || typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
    return null;
  }

  const expected = createHmac('sha256', secret).update(parts[0]).digest();
  const received = Buffer.from(parts[1], 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!keyIdPattern.test(String(payload.keyId || '')) || !slugPattern.test(String(payload.slug || ''))) return null;
    return { keyId: payload.keyId, slug: payload.slug };
  } catch {
    return null;
  }
}
