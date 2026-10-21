# Catálogo, busca e versão

[Índice](../README.md) · [Modelos](models.md) · [OpenAPI](../../openapi.json)

Origem: `https://branilist.com`. Estas rotas não exigem OAuth. API keys são opcionais nas consultas de catálogo e busca.

## Visão geral

| Método | Caminho | API key, se enviada |
| --- | --- | --- |
| GET | `/api/v1` | Não é validada por esta rota |
| GET | `/api/v1/search` | `search:read` |
| GET | `/api/v1/media/{id}` | `catalog:read` |
| GET | `/api/v1/media/mal/{id}` | `catalog:read` |
| GET | `/api/v1/media/anilist/{id}` | `catalog:read` |

## GET /api/v1

Metadados da API. Responde 200 com `name`, `version`, `oauth`, `authorize` e `docs`. As URLs dependem da implantação; `oauth` é um caminho relativo. Veja uma resposta no [início rápido](../getting-started.md).

## GET /api/v1/search

Busca pública por títulos romaji, inglês e português. Os resultados são ordenados por popularidade decrescente, com desempate por ID decrescente.

| Query | Obrigatório | Regra |
| --- | --- | --- |
| `q` | Sim | Texto após remover espaços nas extremidades; a implementação valida ao menos 2 bytes UTF-8. Use ao menos 2 caracteres no cliente |
| `limit` | Não | Inteiro de 1 a 50; padrão 20. Valores inválidos ou fora da faixa usam 20 |

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/search' \
  --data-urlencode 'q=Frieren' --data-urlencode 'limit=10'
```

```json
{
  "items": [{
    "id": 123,
    "slug": "exemplo-anime",
    "type": "ANIME",
    "format": "TV",
    "title": {"romaji": "Exemplo", "english": "Example", "portuguese": null},
    "coverImage": null,
    "averageScore": 85,
    "popularity": 250
  }]
}
```

Resposta 200, incluindo `items: []` quando não há resultados. Não há `page`, cursor, `total` ou filtro `type` nesta rota. Para filtros ANIME/MANGA, relevância avançada e preferências da conta, use a [busca autenticada](account.md).

Erros: 400 para `q` curto; 401 para API key inválida/sem escopo; 429 para limite/quota; 500 para falha de consulta; 503 para integração/quota indisponível.

## GET /api/v1/media/{id}

Obtém os detalhes pelo ID interno do Branilist. O ID precisa ser um inteiro positivo representável em 64 bits.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/123'
```

Responde 200 com um objeto [Media](models.md), sem envelope `data` ou `items`.

```json
{
  "id": 123,
  "slug": "exemplo-anime",
  "type": "ANIME",
  "status": "FINISHED",
  "format": "TV",
  "title": {"romaji": "Exemplo", "english": "Example", "native": null, "portuguese": null},
  "description": "Sinopse ilustrativa.",
  "coverImage": null,
  "bannerImage": null,
  "episodes": 12,
  "chapters": null,
  "seasonYear": 2026,
  "averageScore": 85,
  "popularity": 250,
  "isAdult": false
}
```

Erros: 400 para ID inválido; 404 para mídia inexistente; 401, 429, 500 e 503 conforme autenticação e disponibilidade.

## GET /api/v1/media/mal/{id}

Consulta pelo identificador numérico do **MyAnimeList**.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/mal/5114'
```

## GET /api/v1/media/anilist/{id}

Consulta pelo identificador numérico do **AniList**.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/anilist/16498'
```

As duas rotas retornam o mesmo modelo Media da consulta interna. O campo `id` da resposta é sempre o **ID do Branilist**, que deve ser usado na biblioteca.

Elas consultam vínculos já existentes; não chamam nem importam automaticamente os provedores. Um ID válido no provedor pode retornar 404 se ainda não houver vínculo no Branilist. Não há parâmetro de tipo nesta consulta. Cache e limites seguem os detalhes por ID interno, com cache separado por provedor.

IDs malformados, não positivos ou acima de 64 bits retornam 400. Mapeamento ausente retorna 404. [Limites e cache](../rate-limits.md) descrevem os cabeçalhos.
