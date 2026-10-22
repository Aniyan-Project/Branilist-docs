import { pathToFileURL } from 'node:url'

export async function graphql(query, variables = {}, {
  accessToken, apiKey, operationName,
  endpoint = 'https://branilist.com/api/graphql', fetchImpl = fetch
} = {}) {
  if (!query?.trim()) throw new Error('GraphQL query is required')
  if (accessToken && apiKey) throw new Error('Choose OAuth or API key, not both')
  const headers = new Headers({ Accept: 'application/graphql-response+json, application/json', 'Content-Type': 'application/json' })
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (apiKey) headers.set('X-Branilist-API-Key', apiKey)
  const response = await fetchImpl(endpoint, {
    method: 'POST', headers, body: JSON.stringify({ query, variables, operationName }), signal: AbortSignal.timeout(15000)
  })
  const text = await response.text()
  let result
  try { result = JSON.parse(text) } catch { throw new Error(`Unexpected GraphQL response (HTTP ${response.status})`) }
  if (!response.ok || result.errors?.length) {
    const error = new Error(result.errors?.map(e => e.message).join('; ') || `HTTP ${response.status}`)
    error.status = response.status
    error.errors = result.errors ?? []
    error.data = result.data ?? null
    error.requestId = response.headers.get('X-Request-ID')
    throw error
  }
  return { data: result.data, headers: response.headers }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await graphql('query { api { name version } mediaPage(search: "Frieren", first: 3) { nodes { id title { romaji } } } }', {}, {
      accessToken: process.env.BRANILIST_ACCESS_TOKEN, apiKey: process.env.BRANILIST_API_KEY
    })
    console.log(JSON.stringify(result.data, null, 2))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
