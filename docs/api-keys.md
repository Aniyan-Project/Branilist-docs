# API keys

[Índice](README.md) · [OAuth](authentication.md) · [Limites](rate-limits.md)

Use API keys para consultas de catálogo feitas pelo seu servidor. Crie e gerencie as chaves no [painel de desenvolvedores](https://branilist.com/settings/developer), dentro do aplicativo correspondente.

| Escopo | Rotas |
| --- | --- |
| `catalog:read` | Detalhes por ID Branilist, MyAnimeList e AniList |
| `search:read` | Busca pública `/api/v1/search` |

```sh
export BRANILIST_API_KEY='SUBSTITUA_PELA_API_KEY'
curl --fail-with-body 'https://branilist.com/api/v1/media/123' \
  -H "X-Branilist-API-Key: $BRANILIST_API_KEY"
```

Uma chave válida associa a chamada ao aplicativo e aplica seus limites e quota. Uma chave inválida ou sem o escopo retorna `401 invalid_api_key`; a chamada não é reprocessada como anônima.

## Guardar e substituir

- Guarde o segredo apresentado na criação em uma variável de ambiente ou gerenciador de segredos.
- Não inclua a chave em código de navegador, aplicativo distribuído, URL, exemplo público ou repositório.
- Use rotação e revogação no painel quando necessário. Confira o funcionamento da substituição no seu ambiente.
- A chave não identifica o usuário final e não autoriza ler ou remover sua biblioteca.

## Navegador e CORS

O CORS atual não inclui `X-Branilist-API-Key` na lista de cabeçalhos aceitos no preflight. Use API keys no backend. Para integrações de usuário no navegador, siga o fluxo OAuth e envie o access token no cabeçalho `Authorization`.
