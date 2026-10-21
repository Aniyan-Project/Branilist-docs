# Rate limits, caching, and CORS

[Index](README.md) · [Errors](errors.md)

## Reference limits

These values reflect the reviewed implementation. Infrastructure and application configuration may impose additional limits. The limiter uses one-minute windows, not an availability guarantee.

| Access | Limit |
| --- | --- |
| Anonymous details, including MAL/AniList | 240 calls/minute per IP, shared across all three detail endpoints |
| Anonymous public search | 120 calls/minute per IP |
| OAuth user endpoints | 300 calls/minute per token, shared |
| `/oauth/token` issuance/refresh | 120 calls/minute per client ID |
| Additional authenticated app layer | Configurable per app **and operation**, initially 120/minute |
| Authenticated app daily quota | Configurable; initial default 10,000 requests |

API keys and OAuth share the application's daily quota. Calls reaching quota reservation count even if they later fail or use the cache. Failures before reservation do not necessarily count.

## Usage headers

When the app quota layer is active:

| Header | Meaning |
| --- | --- |
| `X-RateLimit-Limit` | App **daily quota**, not the per-minute rate |
| `X-RateLimit-Remaining` | Remaining daily requests after reservation |
| `X-RateLimit-Reset` | Unix timestamp for the next UTC midnight reported by the API |
| `Retry-After` | Seconds to wait; present on some per-minute rejections |

Headers may be absent on anonymous calls or early rejections. Daily accounting uses the database date; check the dashboard if the reported reset differs from the deployment's actual quota window.

## Catalog caching

| Endpoint | `Cache-Control` |
| --- | --- |
| Internal/MAL/AniList detail | `public, max-age=30, stale-while-revalidate=120` |
| Public search | `public, max-age=15, stale-while-revalidate=60` |
| Authenticated search | `private, no-store` |
| Library deletion / token issuance | `no-store` |

Catalog queries return `X-Branilist-Cache: HIT` or `MISS`. The internal cache TTL is configurable and may differ from `max-age`. Internal and provider IDs have separate cache entries, so changes may appear at different times. Immediate read-after-write freshness is not guaranteed.

Never put personal responses in shared caches, even if an endpoint does not explicitly send `no-store`. Do not assume ETag, `If-None-Match`, or 304 support.

## CORS

`/api/v1`, `/oauth/token`, and `/oauth/revoke` allow origin `*`, without cookie credentials. Send Bearer with `fetch`, without `credentials: 'include'`.

Browsers can currently read `X-Request-ID` and `X-Branilist-Cache`, but `X-RateLimit-*` and `Retry-After` are not exposed through CORS. Server clients can still read them. `X-Branilist-API-Key` is also absent from allowed preflight headers; use it on your backend.

CORS advertises GET, POST, PUT, PATCH, DELETE, and OPTIONS. That does not create PATCH API v1 endpoints. A successful OPTIONS preflight does not establish authorization to perform an operation.
