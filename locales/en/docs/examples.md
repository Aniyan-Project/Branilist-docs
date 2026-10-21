# Integration examples

[Index](README.md) · [Quick start](getting-started.md)

Executable examples use **Node.js 22+**, without runtime dependencies. Use only credentials for your own integration. No script deletes entries automatically.

## JavaScript client

```sh
node examples/request.mjs
BRANILIST_ACCESS_TOKEN='YOUR_TOKEN' node examples/request.mjs /api/v1/me
```

The first command performs public `frieren` search; the second needs `profile:read`. Run commands from the repository root.

```js
import { request } from './examples/request.mjs'
const media = await request('/api/v1/media/anilist/16498')
console.log(media.data.id)
const library = await request('/api/v1/me/library', {
  accessToken: process.env.BRANILIST_ACCESS_TOKEN
})
console.log(library.data.items)
```

The client handles JSON/text errors and empty bodies and exposes headers. It does not automatically retry writes or refresh OAuth tokens. [Client source](../../../examples/request.mjs).

## Generate PKCE

```sh
node examples/pkce.mjs
```

The output contains `state`, `codeVerifier`, `codeChallenge`, `codeChallengeMethod`, and an illustrative authorization URL. Use the verifier only for the same attempt. In production, do not log it or put it in the authorization URL. [Generator source](../../../examples/pkce.mjs).

## Explicit deletion

```js
import { request } from './examples/request.mjs'
// Run only after an explicit user action.
const result = await request('/api/v1/me/library/123', {
  method: 'DELETE', accessToken: process.env.BRANILIST_ACCESS_TOKEN
})
console.log(result.data.removed)
```

Replace 123 with the internal media ID and use `library:write`. Read the [idempotent deletion rules](reference/library.md).

## API tools

Import [openapi.json](../../../openapi.json) into an OpenAPI 3.1 tool. It describes public HTTP/token operations and powers the generated reference. Browser consent is covered in the OAuth guide.

Use API keys only in tools running as server clients; configure OAuth scopes for `/me`. Example media ID 123 is not guaranteed to exist.

## Local checks

```sh
npm run check
```

Checks cover links, JSON examples, OpenAPI references/operations, source syntax, and example/generator behavior. Example tests use mocked responses and do not change Branilist accounts.
