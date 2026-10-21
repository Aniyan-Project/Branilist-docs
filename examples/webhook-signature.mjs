import { createHmac, timingSafeEqual } from 'node:crypto'

// rawBody must be the original HTTP body bytes, before JSON parsing.
export function verifyWebhook({ secret, timestamp, signature, rawBody,
  now = Math.floor(Date.now() / 1000), toleranceSeconds = 300 }) {
  if (typeof secret !== 'string' || !secret || !Buffer.isBuffer(rawBody)) return false
  if (!/^\d+$/.test(String(timestamp)) || !/^v1=[a-f0-9]{64}$/.test(String(signature))) return false
  const seconds = Number(timestamp)
  if (!Number.isSafeInteger(seconds) || Math.abs(now - seconds) > toleranceSeconds) return false
  const expected = createHmac('sha256', secret)
    .update(String(timestamp)).update('.').update(rawBody).digest()
  const actual = Buffer.from(signature.slice(3), 'hex')
  return actual.length === expected.length && timingSafeEqual(expected, actual)
}
