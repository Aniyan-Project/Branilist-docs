# Início rápido

[Índice](README.md) · Próximo: [OAuth](authentication.md)

## 1. Consulte a versão

```sh
curl --fail-with-body 'https://branilist.com/api/v1'
```

```json
{
  "name": "Branilist Public API",
  "version": "v1",
  "oauth": "/oauth/token",
  "authorize": "https://branilist.com/oauth/authorize",
  "docs": "https://branilist.com/developers"
}
```

## 2. Busque uma mídia

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/search' \
  --data-urlencode 'q=frieren' \
  --data-urlencode 'limit=5'
```

A resposta é `{ "items": [...] }`. Use `items[i].id` para consultar os detalhes:

```sh
# Substitua 123 por um id retornado pela busca.
curl --fail-with-body 'https://branilist.com/api/v1/media/123'
```

## 3. Escolha a autenticação adequada

| Objetivo | Credencial |
| --- | --- |
| Consultas públicas ocasionais | Nenhuma; há limites por IP |
| Integração de catálogo no seu servidor | API key com `catalog:read` e/ou `search:read` |
| Acessar a conta e a biblioteca de uma pessoa | Access token OAuth com os escopos consentidos |

Crie seu aplicativo no [painel](https://branilist.com/settings/developer). Para contas de usuário, implemente o [fluxo OAuth](authentication.md). Uma API key não substitui o consentimento do usuário.

## 4. Leia a biblioteca autorizada

Depois de concluir o OAuth, use o access token:

```sh
export BRANILIST_ACCESS_TOKEN='SUBSTITUA_PELO_ACCESS_TOKEN'
curl --fail-with-body 'https://branilist.com/api/v1/me/library' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

O token precisa de `library:read`. Solicite `library:write` separadamente para atualizar ou remover uma entrada. Os exemplos de shell usam sintaxe POSIX; no PowerShell, use `$env:BRANILIST_ACCESS_TOKEN` para acessar a variável de ambiente.

## Antes de integrar

- Use HTTPS e trate respostas não exitosas antes de ler o resultado.
- Preserve campos `null` e não suponha que todo título tenha tradução.
- Diferencie o ID interno dos IDs MAL/AniList.
- Confira [erros](errors.md), [limites](rate-limits.md) e as regras de [atualização da biblioteca](reference/library.md).
