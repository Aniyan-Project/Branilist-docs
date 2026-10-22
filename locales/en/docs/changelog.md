# Documentation changelog

[Index](README.md)

## 2026-10-22 — Public user queries

- Other users' profiles, libraries, published activity and collections by ID or username, using OAuth and existing read scopes.
- PUBLIC visibility, bidirectional blocks, private-entry filtering and exclusion of PRIVATE/UNLISTED collections.
- Pagination and three-language documentation. Availability depends on the corresponding API deployment.

## 2026-10-21 — Languages

- Portuguese, English, and Spanish versions with a language selector.
- Localized guides, menus, search, and generated API reference.
- Matching page paths preserve context when switching languages; existing Portuguese URLs remain valid.

## 2026-10-21 — Website and initial edition

- VitePress on GitHub Pages with sidebar, local search, and light/dark themes.
- Automatic operation/model generation from OpenAPI and discovery of Markdown guides.
- GitHub Actions validation/publishing; PR builds do not replace production.
- Reference for public REST v1 operations, token/revocation endpoints, and OAuth PKCE.
- API keys, limits, caching, CORS, error formats, and library PUT/deletion semantics.
- Internal/MAL/AniList lookups, profile, authenticated search, history, collections, and webhooks.
- OpenAPI 3.1 and dependency-free JavaScript integration examples.

Initial editorial review used Branilist revision `ef68a81f0357f38a24fe07e1feec7b18963a7a18`. This records the implementation baseline without requiring access to its repository. This is the documentation history, not the product's full release log.
