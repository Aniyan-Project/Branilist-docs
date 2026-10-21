import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { request } from './request.mjs'
import { generatePKCE } from './pkce.mjs'
import { verifyWebhook } from './webhook-signature.mjs'

test('PKCE uses a fresh verifier/state and S256 without padding', () => {
  const a = generatePKCE(), b = generatePKCE()
  assert.match(a.codeVerifier, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(a.codeChallenge, createHash('sha256').update(a.codeVerifier).digest('base64url'))
  assert.equal(a.codeChallengeMethod, 'S256')
  assert.notEqual(a.codeVerifier, b.codeVerifier)
  assert.notEqual(a.state, b.state)
})
test('client sends Bearer and reads JSON, empty bodies and plain text errors', async () => {
  const fetchImpl = async (url, init) => {
    assert.equal(url, 'https://branilist.com/api/v1/me/library/123')
    assert.equal(init.method, 'DELETE')
    assert.equal(init.headers.get('Authorization'), 'Bearer example')
    return Response.json({ ok: true, mediaId: 123, removed: true })
  }
  const result = await request('/api/v1/me/library/123', { method: 'DELETE', accessToken: 'example', fetchImpl })
  assert.equal(result.data.removed, true)
  const empty = await request('/oauth/revoke', { fetchImpl: async () => new Response(null, { status: 200 }) })
  assert.equal(empty.data, null)
  await assert.rejects(request('/api/v1/media/0', { fetchImpl: async () => new Response('invalid media id', { status: 400 }) }), /HTTP 400: invalid media id/)
  await assert.rejects(request('/api/v1/me', { fetchImpl: async () => Response.json({ error: 'invalid_token', error_description: 'invalid token' }, { status: 401 }) }), error => error.status === 401 && error.code === 'invalid_token')
})
test('webhook validates original bytes and rejects replay, tampering and malformed signatures', () => {
  const secret = 'example-secret', timestamp = '1792584000', rawBody = Buffer.from('{"type":"library.updated"}')
  const signature = 'v1=' + createHmac('sha256', secret).update(timestamp + '.').update(rawBody).digest('hex')
  const input = { secret, timestamp, rawBody, signature, now: Number(timestamp) }
  assert.equal(verifyWebhook(input), true)
  assert.equal(verifyWebhook({ ...input, rawBody: Buffer.from('{}') }), false)
  assert.equal(verifyWebhook({ ...input, now: Number(timestamp) + 301 }), false)
  assert.equal(verifyWebhook({ ...input, signature: 'v1=invalid' }), false)
  assert.equal(verifyWebhook({ ...input, timestamp: 'not-a-timestamp' }), false)
})
