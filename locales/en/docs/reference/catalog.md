# Catalog, search, and version

[Index](../README.md) · [Models](models.md) · [OpenAPI](../../../../openapi.json)

Origin: `https://branilist.com`. These endpoints do not require OAuth. API keys are optional for catalog and search queries.

## Overview

| Method | Path | Scope if an API key is sent |
| --- | --- | --- |
| GET | `/api/v1` | This endpoint does not validate the key |
| GET | `/api/v1/search` | `search:read` |
| GET | `/api/v1/media/{id}` | `catalog:read` |
| GET | `/api/v1/media/mal/{id}` | `catalog:read` |
| GET | `/api/v1/media/anilist/{id}` | `catalog:read` |

## GET /api/v1

Returns 200 with `name`, `version`, `oauth`, `authorize`, and `docs`. URLs depend on deployment; `oauth` is a relative path. See the [quick start](../getting-started.md) for an example.

## GET /api/v1/search

Public search matches romaji, English, and Portuguese titles. Results are ordered by descending popularity, then descending ID.

| Query | Required | Rule |
| --- | --- | --- |
| `q` | Yes | Trimmed text; implementation checks at least 2 UTF-8 bytes. Prefer at least 2 characters in clients |
| `limit` | No | Integer from 1 to 50; default 20. Invalid or out-of-range values use 20 |

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/search' \
  --data-urlencode 'q=Frieren' --data-urlencode 'limit=10'
```

```json
{"items":[{"id":123,"slug":"example-anime","type":"ANIME","format":"TV","title":{"romaji":"Example","english":"Example","portuguese":null},"coverImage":null,"averageScore":85,"popularity":250}]}
```

Returns 200, including `items: []` when nothing matches. There is no `page`, cursor, `total`, or `type` filter. For ANIME/MANGA filters, relevance, and account preferences, use [authenticated search](account.md).

Errors: 400 for short `q`; 401 for invalid/insufficient API key; 429 for limits/quota; 500 for query failures; 503 when the integration/quota service is unavailable.

## GET /api/v1/media/{id}

Fetches details by the internal Branilist ID, which must be a positive 64-bit integer.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/123'
```

Returns 200 with a [Media](models.md) object, without `data` or `items` envelopes:

```json
{"id":123,"slug":"example-anime","type":"ANIME","status":"FINISHED","format":"TV","title":{"romaji":"Example","english":"Example","native":null,"portuguese":null},"description":"Illustrative synopsis.","coverImage":null,"bannerImage":null,"episodes":12,"chapters":null,"seasonYear":2026,"averageScore":85,"popularity":250,"isAdult":false}
```

Errors: 400 for invalid IDs; 404 for missing media; 401, 429, 500, and 503 depending on authentication and availability.

## GET /api/v1/media/mal/{id}

Looks up a numeric **MyAnimeList** ID:

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/mal/5114'
```

## GET /api/v1/media/anilist/{id}

Looks up a numeric **AniList** ID:

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/anilist/16498'
```

Both return the same Media model. The response `id` is always the **Branilist ID** to use for library operations.

These endpoints only query existing mappings. They do not contact or import from providers automatically. A valid provider ID may return 404 when Branilist has no mapping. There is no type parameter. Caching and limits match the internal detail endpoint, with separate cache entries per provider.

Malformed, nonpositive, or out-of-64-bit-range IDs return 400. Missing mappings return 404. See [limits and caching](../rate-limits.md) for headers.
