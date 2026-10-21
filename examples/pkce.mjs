import { randomBytes, createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

export function generatePKCE() {
  const codeVerifier = randomBytes(32).toString('base64url')
  return {
    state: randomBytes(32).toString('base64url'),
    codeVerifier,
    codeChallenge: createHash('sha256').update(codeVerifier).digest('base64url'),
    codeChallengeMethod: 'S256'
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkce = generatePKCE()
  const url = new URL('https://branilist.com/oauth/authorize')
  url.search = new URLSearchParams({
    response_type: 'code', client_id: 'SEU_CLIENT_ID',
    redirect_uri: 'https://seu-app.example/callback', scope: 'profile:read library:read',
    state: pkce.state, code_challenge: pkce.codeChallenge,
    code_challenge_method: pkce.codeChallengeMethod
  }).toString()
  console.log(JSON.stringify({ ...pkce, authorizationUrl: url.href }, null, 2))
}
