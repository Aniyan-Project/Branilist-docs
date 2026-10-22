import { test } from 'node:test'
import assert from 'node:assert/strict'
import { graphql } from './graphql.mjs'

test('GraphQL client preserves partial data and catches GraphQL errors on HTTP 200', async () => {
  let requests = 0
  const fetchImpl = async (url, options) => {
    requests++
    assert(url.endsWith('/api/graphql'))
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.get('Authorization'), 'Bearer example-token')
    assert.deepEqual(JSON.parse(options.body).variables, { id: '123' })
    return new Response(JSON.stringify({ data: { media: null }, errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }] }), { status: 200 })
  }
  await assert.rejects(graphql('query($id: ID!) { media(id:$id) { id } }', { id: '123' }, { accessToken: 'example-token', fetchImpl }), error => {
    assert.equal(error.status, 200)
    assert.equal(error.errors[0].extensions.code, 'FORBIDDEN')
    assert.deepEqual(error.data, { media: null })
    return true
  })
  assert.equal(requests, 1, 'writes/queries must not be retried automatically')
  await assert.rejects(graphql('{api{name}}', {}, { accessToken: 'token', apiKey: 'key', fetchImpl }))
  assert.equal(requests, 1)
})
