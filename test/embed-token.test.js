import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmbedToken, verifyEmbedToken } from '../server/embed-token.js';

const secret = 'unit-test-only-secret-for-embed-tokens';
const keyId = 'f1c2b3a4-5678-4abc-9def-1234567890ab';

test('embed token is scoped to one API-owned work', () => {
  const token = createEmbedToken(keyId, 'black-clover', secret);
  assert.deepEqual(verifyEmbedToken(token, secret), { keyId, slug: 'black-clover' });
});

test('embed token rejects tampering and malformed values', () => {
  const token = createEmbedToken(keyId, 'black-clover', secret);
  assert.equal(verifyEmbedToken(`${token}x`, secret), null);
  assert.equal(verifyEmbedToken('not-a-token', secret), null);
  assert.equal(verifyEmbedToken(token, 'different-secret'), null);
});

test('embed token refuses invalid work scopes', () => {
  assert.throws(() => createEmbedToken('not-a-uuid', 'black-clover', secret));
  assert.throws(() => createEmbedToken(keyId, '../other-work', secret));
});
