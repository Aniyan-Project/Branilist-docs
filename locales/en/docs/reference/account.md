# Profile, search, history, and collections

[Index](../README.md) · [Models](models.md) · [OAuth](../authentication.md)

All calls use `Authorization: Bearer ACCESS_TOKEN`. API keys cannot access these endpoints.

`/me` endpoints query the token owner. For another person, see [public user data](public-users.md).

| Method | Path | Scope |
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
{"id":42,"username":"example","displayName":"Example Person","avatarUrl":null,"bannerUrl":null,"bio":null,"createdAt":"2026-01-01T00:00:00Z","scopes":["profile:read","library:read"]}
```

Email is not returned. `scopes` lists the token's scopes. Unavailable/inactive accounts return 404.

## GET /api/v1/me/search

Advanced search on behalf of the user, respecting the global adult-content setting and their hide-adult preference. Authorization does not guarantee adult results.

| Query | Rule |
| --- | --- |
| `q` | Required; at least 2 Unicode characters after trimming |
| `limit` | Integer 1–30, default 20; invalid/out-of-range values use 20 |
| `type` | Optional `ANIME` or `MANGA`, normalized to uppercase; other values return 400 |

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/me/search' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN" \
  --data-urlencode 'q=Frieren' --data-urlencode 'type=MANGA' --data-urlencode 'limit=10'
```

Returns 200 with `{ "items": [...] }` in relevance order. Each item contains `id`, `slug`, `type`, `status`, `format`, a four-language `title`, `description`, `descriptionEnglish`, `coverImage`, `chapters`, `averageScore`, `startDate`, `endDate`, and `isAdult`. Dates use `YYYY-MM-DD` or `null`. **This is not the full Media detail model**: `episodes`, for example, is absent.

Uses `Cache-Control: private, no-store`. No matches return an empty array. No pagination. Search unavailability may return 503; unavailable accounts return 404.

## GET /api/v1/me/activity

Returns up to **200 personal history records**, newest first, without pagination or cursors. This is not a platform-wide public feed.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/activity' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"items":[{"mediaId":123,"eventType":"UPDATED","status":"CURRENT","previousStatus":"CURRENT","progress":3,"previousProgress":2,"progressDelta":1,"score":8.5,"repeatCount":0,"createdAt":"2026-10-21T12:00:00Z","media":{"id":123,"slug":"example-anime","type":"ANIME","title":"Example","coverImage":null}}]}
```

Library events include `CREATED`, `UPDATED`, and `REMOVED`; tolerate future types. Removal preserves the previous state and has `progressDelta: 0`, rather than representing negative consumption. Here, `media.title` is a **string**, not a multilingual object.

## GET /api/v1/me/collections

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/collections' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"items":[{"id":7,"mediaType":"ANIME","name":"Season favorites","slug":"season-favorites","description":null,"color":"","visibility":"PRIVATE","tags":[],"coverMediaId":null,"position":0,"publishedAt":null,"itemCount":2,"createdAt":"2026-10-01T12:00:00Z","updatedAt":"2026-10-21T12:00:00Z"}]}
```

Includes the token owner's private collections, ordered by `position`, then newest creation date. The query has no current limit/pagination. `itemCount` is a count, not media items; collection contents are not included. Public v1 has no collection creation/update endpoints.

## Common failures

Successful calls return 200. Invalid or insufficient-scope tokens return 401. Legacy handlers may return 429 for absent Bearer; see [errors](../errors.md). Queries can fail with 500, limits/quota with 429, and unavailable integrations with 503.
