# Histórico da documentação

[Índice](README.md)

## 2026-10-21 — Primeira edição

### Site e publicação automática

- Site VitePress no GitHub Pages, com navegação lateral, busca local e temas claro/escuro.
- Páginas de operações e modelos JSON geradas de `openapi.json`.
- Descoberta automática de novas páginas Markdown e regeneração de rotas alteradas ou removidas.
- Validação e publicação por GitHub Actions; pull requests fazem build sem substituir o site público.
- Guia de manutenção e testes de adição, alteração e remoção de operações.

### Documentação inicial

- Referência das 12 operações REST públicas v1 e dos endpoints de token/revogação.
- Fluxo OAuth Authorization Code com PKCE S256, renovação e escopos.
- API keys, quotas, cache, CORS e formatos atuais de erro.
- Biblioteca: leitura, semântica de PUT e remoção idempotente.
- Consultas por IDs Branilist, MyAnimeList e AniList.
- Perfil, busca autenticada, histórico e coleções.
- Recepção e verificação de webhooks.
- OpenAPI 3.1 e exemplos JavaScript sem dependências.

Verificação editorial baseada na implementação Branilist da revisão `ef68a81f0357f38a24fe07e1feec7b18963a7a18`. Esse identificador registra a base da conferência, sem exigir acesso ao repositório de implementação para ler esta documentação.

Este é o histórico da documentação; não é o histórico completo de releases do produto.
