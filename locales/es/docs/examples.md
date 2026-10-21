# Ejemplos de integración

[Índice](README.md) · [Inicio rápido](getting-started.md)

Los ejemplos ejecutables usan **Node.js 22+**, sin dependencias de ejecución. Usa credenciales de tu propia integración. Ningún script elimina entradas automáticamente.

## Cliente JavaScript

```sh
node examples/request.mjs
BRANILIST_ACCESS_TOKEN='YOUR_TOKEN' node examples/request.mjs /api/v1/me
```

El primer comando busca `frieren` públicamente; el segundo requiere `profile:read`. Ejecuta los comandos desde la raíz del repositorio.

```js
import { request } from './examples/request.mjs'
const media = await request('/api/v1/media/anilist/16498')
console.log(media.data.id)
const library = await request('/api/v1/me/library', {
  accessToken: process.env.BRANILIST_ACCESS_TOKEN
})
console.log(library.data.items)
```

El cliente maneja errores JSON/texto y cuerpos vacíos, y expone las cabeceras. No reintenta escrituras ni renueva tokens OAuth automáticamente. [Código del cliente](../../../examples/request.mjs).

## Generar PKCE

```sh
node examples/pkce.mjs
```

La salida contiene `state`, `codeVerifier`, `codeChallenge`, `codeChallengeMethod` y una URL de autorización ilustrativa. Usa el verificador solo para el mismo intento. En producción, no lo registres ni lo incluyas en la URL de autorización. [Código del generador](../../../examples/pkce.mjs).

## Eliminación explícita

```js
import { request } from './examples/request.mjs'
// Run only after an explicit user action.
const result = await request('/api/v1/me/library/123', {
  method: 'DELETE', accessToken: process.env.BRANILIST_ACCESS_TOKEN
})
console.log(result.data.removed)
```

Sustituye 123 por el ID interno y usa `library:write`. Consulta las [reglas de eliminación idempotente](reference/library.md).

## Herramientas API

Importa [openapi.json](../../../openapi.json) en una herramienta OpenAPI 3.1. Describe las operaciones HTTP públicas y de tokens, y genera la referencia. El consentimiento del navegador se explica en OAuth.

Usa API keys solo en herramientas que funcionen como clientes de servidor; configura scopes OAuth para `/me`. No se garantiza que el ID ilustrativo 123 exista.

## Comprobaciones locales

```sh
npm run check
```

Comprueban enlaces, ejemplos JSON, referencias/operaciones OpenAPI, sintaxis y comportamiento de ejemplos/generador. Las pruebas usan respuestas simuladas y no modifican cuentas de Branilist.
