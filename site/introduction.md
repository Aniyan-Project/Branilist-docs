# Introdução

A API pública do **Branilist** conecta seu aplicativo ao catálogo de anime e mangá e, com autorização, à biblioteca de uma pessoa. Esta documentação explica como consultar os dados e integrar uma conta usando **REST, JSON e OAuth 2.0 com PKCE**.

## Sua primeira requisição

Você pode começar pela busca pública, sem criar uma credencial:

```sh
curl --fail-with-body 'https://branilist.com/api/v1/search?q=frieren&limit=5'
```

A resposta contém um array `items`. Use o `id` de uma mídia para consultar seus detalhes ou para gerenciar uma entrada da biblioteca com o escopo apropriado.

## Explore a documentação

| Preciso… | Por onde começar |
| --- | --- |
| Fazer minha primeira integração | [Início rápido](../docs/getting-started.md) |
| Conectar a conta de um usuário | [OAuth com PKCE](../docs/authentication.md) |
| Consultar catálogo pelo meu servidor | [API keys](../docs/api-keys.md) |
| Consultar pelos IDs MyAnimeList e AniList | [Catálogo e busca](../docs/reference/catalog.md) |
| Atualizar ou remover uma mídia da biblioteca | [Biblioteca pessoal](../docs/reference/library.md) |
| Entender as regras de uso da API | [Termos de uso da API](../docs/terms-of-use.md) |
| Tratar erros e limites de uso | [Erros](../docs/errors.md) e [limites](../docs/rate-limits.md) |
| Receber eventos na minha integração | [Webhooks](../docs/webhooks.md) |

A aba **Referência** apresenta cada operação, seus parâmetros, os schemas de requisição e resposta e exemplos gerados a partir do OpenAPI. A busca também encontra conteúdo dos guias e dos modelos JSON.

## Endereços da API

| Recurso | Endereço |
| --- | --- |
| API pública v1 | `https://branilist.com/api/v1` |
| Consentimento no navegador | `https://branilist.com/oauth/authorize` |
| Troca e renovação de tokens | `https://branilist.com/oauth/token` |
| Cadastro da integração | [Painel de desenvolvedores](https://branilist.com/settings/developer) |

::: tip IDs e exemplos
O ID retornado pelo catálogo é o identificador interno do Branilist. Mesmo uma consulta por MyAnimeList ou AniList devolve esse ID. Dados e IDs usados como exemplos nesta documentação são ilustrativos.
:::

## Como esta documentação se mantém atualizada

O conteúdo vem dos arquivos Markdown e de `openapi.json` no [GitHub](https://github.com/Aniyan-Project/Branilist-docs). A cada atualização na branch principal, a referência e a navegação são regeneradas e o site é publicado automaticamente.

O OpenAPI é a fonte da referência de rotas. Alterações no backend precisam ser refletidas nele para aparecer aqui. Consulte o [guia de manutenção](../docs/publishing.md) para adicionar uma página ou documentar uma nova rota.
