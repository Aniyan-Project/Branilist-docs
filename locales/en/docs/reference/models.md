# Models and conventions

[Index](../README.md) · [OpenAPI](../../../../openapi.json)

## General conventions

| Topic | Contract |
| --- | --- |
| Transport | HTTPS |
| Data | UTF-8 JSON for success responses, except empty token revocation |
| JSON names | `camelCase`, except OAuth token fields in `snake_case` |
| IDs | Integers; positive 64-bit path IDs |
| Response dates | RFC3339 timestamps, except authenticated search `startDate`/`endDate` |
| Library input dates | Prefer `YYYY-MM-DD`; RFC3339, `null`, and `""` are also accepted |
| Lists | `{ "items": [...] }`, without `data` |
| Unavailable fields | Often `null`; distinguish null from zero and empty strings |

JavaScript clients must consider integer precision above `Number.MAX_SAFE_INTEGER`. IDs are JSON numbers; use an appropriate parser when exact 64-bit values must be preserved.

## Media: public details

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | integer | Internal Branilist ID |
| `slug` | string | Textual identifier |
| `type` | string | `ANIME` or `MANGA` |
| `status` | string | `UPCOMING`, `RELEASING`, `FINISHED`, `CANCELLED`, `HIATUS` |
| `format` | string | Format such as `TV` or `MANGA`; treat as extensible |
| `title` | object | `romaji`, `english`, `native`, `portuguese`; translations may be null |
| `description` | string/null | Synopsis |
| `coverImage`, `bannerImage` | string/null | Image URLs |
| `episodes`, `chapters` | integer/null | Known totals |
| `seasonYear` | integer/null | Season year |
| `averageScore` | integer/null | Catalog aggregate rating on a percentage scale, 0–100 |
| `popularity` | integer | Recorded catalog popularity |
| `isAdult` | boolean | Adult-content flag |

`averageScore` differs from the library's `score` scale. Sanitize descriptions before treating them as trusted HTML.

## Summary models

| Model | Fields |
| --- | --- |
| Public search | `id`, `slug`, `type`, `format`, `title` without `native`, `coverImage`, `averageScore`, `popularity` |
| Embedded library media | `id`, `slug`, `type`, `title` without `native`, `coverImage` |
| Embedded history media | `id`, `slug`, `type`, string `title`, `coverImage` |
| Authenticated search | Dedicated fields in [Account](account.md), including dates and English synopsis |

These are not full Media objects. Missing fields are not necessarily null: each endpoint has its own response model.

## LibraryEntry

`mediaId`, `status`, `progress`, `score`, `repeatCount`, `startedAt`, `completedAt`, `private`, `updatedAt`, `media`.

User **list statuses** are `PLANNING`, `CURRENT`, `COMPLETED`, `PAUSED`, and `DROPPED`, distinct from the release status in `media.status`. Progress/repeats are integers. Personal ratings are 0.5–10 in 0.5 increments, or null.

## HistoryItem

`mediaId`, `eventType`, `status`, `previousStatus`, `progress`, `previousProgress`, `progressDelta`, `score`, `repeatCount`, `createdAt`, `media`. Previous values and ratings may be null. Do not blindly sum all events to calculate consumption.

## Collection

`id`, `mediaType`, `name`, `slug`, `description`, `color`, `visibility`, `tags`, `coverMediaId`, `position`, `publishedAt`, `itemCount`, `createdAt`, `updatedAt`.

Do not infer `visibility` from profile settings; preserve the returned string. Description, cover media ID, and publication date may be null. Tags may be null when no array is stored; tolerate both null and `[]`.

## Compatibility

Ignore unknown fields. Do not rely on JSON property order, scope ordering, or closed sets of formats/events. `/api/v1` versions the REST contract; the product's release number does not replace that prefix.
