# Exemplos de integração

[Índice](README.md) · [Início rápido](getting-started.md)

Os exemplos executáveis usam **Node.js 22 ou superior**, sem dependências. Configure somente credenciais de teste ou da sua própria integração. Nenhum script faz remoções automaticamente.

## Cliente JavaScript com tratamento de erro

```sh
node examples/request.mjs
```

Esse comando faz uma busca pública por `frieren`. Para ler o próprio perfil, forneça um token com `profile:read` e rode:

```sh
BRANILIST_ACCESS_TOKEN='SEU_TOKEN' node examples/request.mjs /api/v1/me
```

Reutilize o módulo em outro script:

```js
import { request } from './examples/request.mjs'

const catalog = await request('/api/v1/media/anilist/16498')
console.log(catalog.data.id)

const library = await request('/api/v1/me/library', {
  accessToken: process.env.BRANILIST_ACCESS_TOKEN
})
console.log(library.data.items)
```

O código reconhece erros JSON e texto, preserva corpo vazio e retorna os cabeçalhos. Não executa retries automáticos de escrita nem renovação de OAuth.

## Gerar PKCE

```sh
node examples/pkce.mjs
```

O resultado contém `state`, `codeVerifier`, `codeChallenge`, `codeChallengeMethod` e uma URL de autorização ilustrativa. Use o verifier apenas na troca do código da mesma tentativa. Em uma aplicação real, não o imprima em logs e não o inclua na URL de autorização.

## Remover uma entrada explicitamente

```js
import { request } from './examples/request.mjs'

// Execute somente após uma ação explícita da pessoa usuária.
const result = await request('/api/v1/me/library/123', {
  method: 'DELETE',
  accessToken: process.env.BRANILIST_ACCESS_TOKEN
})
console.log(result.data.removed)
```

`123` deve ser substituído pelo ID interno. O access token precisa de `library:write`. Leia o comportamento [idempotente da remoção](reference/library.md).

## Ferramentas de API

Importe [openapi.json](../openapi.json) em uma ferramenta compatível com OpenAPI 3.1. A especificação descreve as 14 operações HTTP: 12 em `/api/v1` e 2 de tokens. A página de consentimento no navegador é explicada no guia OAuth.

Nos endpoints públicos, configure a API key apenas se sua ferramenta funcionar como cliente de servidor. Nas rotas `/me`, configure OAuth com o escopo exigido. Os exemplos usam uma mídia fictícia de ID 123; não é uma garantia de que esse ID exista.

## Validar a documentação localmente

```sh
npm run check
```

Verifica links relativos, referências locais do OpenAPI, inventário de operações e sintaxe dos exemplos. Os testes dos exemplos usam respostas simuladas e não fazem chamadas autenticadas ou alterações no Branilist.
