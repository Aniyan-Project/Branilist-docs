import { pathToFileURL } from 'node:url'

export async function request(path, {
  method = 'GET', body, accessToken, apiKey,
  baseUrl = 'https://branilist.com', fetchImpl = fetch
} = {}) {
  if (!path.startsWith('/')) throw new Error('Use um caminho absoluto da API')
  const headers = new Headers({ Accept: 'application/json' })
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (apiKey) headers.set('X-Branilist-API-Key', apiKey)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  })
  const text = await response.text()
  let data = text || null
  if (text && response.headers.get('Content-Type')?.includes('json')) {
    try { data = JSON.parse(text) } catch { /* Preserve an unexpected body. */ }
  }
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null
      ? data.error_description ?? data.error ?? 'Erro da API' : data ?? 'Erro da API'
    const error = new Error(`HTTP ${response.status}: ${message}`)
    error.status = response.status
    error.code = typeof data === 'object' && data !== null ? data.error : undefined
    error.requestId = response.headers.get('X-Request-ID')
    throw error
  }
  return { data, headers: response.headers }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2] ?? '/api/v1/search?q=frieren&limit=5'
  try {
    const result = await request(path, {
      accessToken: process.env.BRANILIST_ACCESS_TOKEN,
      apiKey: process.env.BRANILIST_API_KEY
    })
    console.log(JSON.stringify(result.data, null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
