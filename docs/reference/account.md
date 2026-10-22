# Perfil, busca autenticada, histórico e coleções

[Índice](../README.md) · [Modelos](models.md) · [OAuth](../authentication.md)

Todas as chamadas usam `Authorization: Bearer ACCESS_TOKEN`. API keys não dão acesso a essas rotas.

As rotas `/me` consultam o dono do token. Para consultar outra pessoa, veja [dados públicos de usuários](public-users.md).

| Método | Caminho | Escopo |
| --- | --- | --- |
| GET | `/api/v1/me` | `profile:read` |
| GET | `/api/v1/me/search` | `library:read` |
| GET | `/api/v1/me/activity` | `activity:read` |
| GET | `/api/v1/me/collections` | `collections:read` |

## GET /api/v1/me

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{
  "id": 42, "username": "exemplo", "displayName": "Pessoa Exemplo",
  "avatarUrl": null, "bannerUrl": null, "bio": null,
  "createdAt": "2026-01-01T00:00:00Z",
  "scopes": ["profile:read", "library:read"]
}
```

Não retorna e-mail. `scopes` corresponde aos escopos do token. Conta não disponível/ativa retorna 404.

## GET /api/v1/me/search

Busca avançada em nome da pessoa, respeitando a configuração global de conteúdo adulto e sua preferência de ocultação. A autorização não garante que conteúdo adulto será retornado.

| Query | Regra |
| --- | --- |
| `q` | Obrigatório, ao menos 2 caracteres Unicode depois de remover espaços nas extremidades |
| `limit` | Inteiro de 1 a 30, padrão 20; inválido/fora da faixa usa 20 |
| `type` | Opcional: `ANIME` ou `MANGA`, normalizado para maiúsculas; outro valor retorna 400 |

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/me/search' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN" \
  --data-urlencode 'q=Frieren' --data-urlencode 'type=MANGA' --data-urlencode 'limit=10'
```

Retorna 200 com `{ "items": [...] }`, em ordem de relevância. Cada item contém `id`, `slug`, `type`, `status`, `format`, `title` com quatro idiomas, `description`, `descriptionEnglish`, `coverImage`, `chapters`, `averageScore`, `startDate`, `endDate` e `isAdult`. Datas de início e fim usam `YYYY-MM-DD` ou `null`. **Não é o mesmo modelo do detalhe de mídia**: não inclui `episodes`, por exemplo.

Resposta tem `Cache-Control: private, no-store`. Sem resultados, `items` é vazio. Não há paginação. Busca indisponível pode responder 503; conta indisponível responde 404.

## GET /api/v1/me/activity

Retorna até **200 registros** de histórico do usuário, do mais recente para o mais antigo, sem cursor ou paginação. Não é um feed público de toda a plataforma.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/activity' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{
  "items": [{
    "mediaId": 123, "eventType": "UPDATED", "status": "CURRENT",
    "previousStatus": "CURRENT", "progress": 3, "previousProgress": 2,
    "progressDelta": 1, "score": 8.5, "repeatCount": 0,
    "createdAt": "2026-10-21T12:00:00Z",
    "media": {"id":123,"slug":"exemplo-anime","type":"ANIME","title":"Exemplo","coverImage":null}
  }]
}
```

Eventos da biblioteca incluem `CREATED`, `UPDATED` e `REMOVED`. Aceite novos tipos no futuro. Em remoções, o estado anterior é mantido no registro e `progressDelta` é 0; não interprete a remoção como consumo negativo. Aqui `media.title` é **string**, não o objeto multilíngue do catálogo.

## GET /api/v1/me/collections

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/collections' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{
  "items": [{
    "id": 7, "mediaType": "ANIME", "name": "Favoritos da temporada",
    "slug": "favoritos-da-temporada", "description": null, "color": "",
    "visibility": "PRIVATE", "tags": [], "coverMediaId": null,
    "position": 0, "publishedAt": null, "itemCount": 2,
    "createdAt": "2026-10-01T12:00:00Z", "updatedAt": "2026-10-21T12:00:00Z"
  }]
}
```

Retorna as coleções do dono do token, incluindo privadas, ordenadas por `position` e depois por criação decrescente. A consulta atual não aplica limite/paginação. `itemCount` é a contagem, não a lista de mídias: este endpoint não retorna os itens da coleção. Não há rotas públicas v1 de criação/edição de coleções.

## Falhas comuns

As respostas exitosas usam 200. Token inválido ou sem o escopo retorna 401. Os endpoints legados podem retornar 429 quando o Bearer estiver ausente; veja [erros](../errors.md). Falhas de consulta retornam 500; limites/quota retornam 429 e indisponibilidade de integração pode retornar 503.
