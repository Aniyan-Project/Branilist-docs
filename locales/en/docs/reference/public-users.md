# Other users' public data

[Index](../README.md) · [Token owner's account](account.md) · [OAuth](../authentication.md)

These endpoints query another user without their token. Send a valid OAuth access token for your integration with the indicated scope. API keys and site sessions do not replace Bearer authentication. Only **PUBLIC** data is returned, even when the target owns the token. Continue using `/me` for your authorized personal data.

## Endpoints and authentication

| Resource | By ID | By username | Scope |
| --- | --- | --- | --- |
| Profile | `/api/v1/users/id/{id}` | `/api/v1/users/by-username/{username}` | `profile:read` |
| Library | `/api/v1/users/id/{id}/library` | `/api/v1/users/by-username/{username}/library` | `library:read` |
| Activity | `/api/v1/users/id/{id}/activity` | `/api/v1/users/by-username/{username}/activity` | `activity:read` |
| Collections | `/api/v1/users/id/{id}/collections` | `/api/v1/users/by-username/{username}/collections` | `collections:read` |

All use **GET**. `id` is the **user's** positive internal 64-bit ID, not a media ID. Usernames accept 3–24 ASCII letters, digits or `_`, case-insensitively. Explicit prefixes distinguish numeric usernames from IDs.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/users/by-username/example' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

The profile returns `id`, `username`, `displayName`, `avatarUrl`, `bannerUrl`, `bio` and `createdAt`, without email, target scopes or administrative information. Images and bio may be `null`. Treat bio as user content and sanitize it before rendering HTML.

## Privacy

- The profile must be `PUBLIC`; the account must be active and not deleted.
- Library and collections also require `list_visibility = PUBLIC`.
- Activity requires public profile, lists and `activity_visibility`.
- Blocks in either direction between token owner and target prevent all queries.
- `PRIVATE` and `FOLLOWERS` settings are never bypassed here, including for followers, the owner or administrators.
- All responses include `Cache-Control: private, no-store`; privacy is checked on every call.

Missing, unavailable, blocked or insufficiently public users produce the same **404**.

## Public library

Uses [LibraryEntry](models.md) fields, excluding private entries before pagination. `private` is always `false`. Ordered by descending `updatedAt`, then descending `mediaId` for ties. The `score` scale remains 0.5–10.

## Published activity

Returns only published **MEDIA_LIST** feed events associated with a current non-private entry. This is not the audit history from `/me/activity`: removals, previous states, historical ratings, reviews, follows and posts are excluded.

Each item has `id`, `type`, `mediaId`, `status`, `progress`, `createdAt` and `media`. Here, `media` contains `id`, `slug`, `type`, string `title` and `coverImage`. Ordered by descending `createdAt` and `id`. Deleted feed events and events without a current public entry are absent. A missing event does not prove that no reading/viewing occurred.

Library and activity respect the global adult-content setting and the **token owner's** hide-adult preference. If the global control is unavailable, adult content stays hidden.

## Public collections

Returns [Collection](models.md) objects with `visibility = PUBLIC` only. `PRIVATE` and `UNLISTED` are omitted, even for the owner. Ordered by ascending `position`, then descending `createdAt` and `id`. `itemCount` is a count; collection contents are not included.

## Pagination

Library, activity and collections accept `limit` **1–100** (default **20**) and `offset` **0–10000** (default **0**). Empty, repeated, noninteger or out-of-range parameters return 400.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/users/id/42/library?limit=20&offset=0' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"items":[],"limit":20,"offset":0,"hasMore":false}
```

`hasMore` indicates additional results after the page. Increase `offset` by `limit` within the allowed range. Concurrent changes may shift results; pagination is neither a snapshot nor a guaranteed complete export. Empty pages return 200 with `items: []`.

## Errors and limits

| Status | Meaning |
| --- | --- |
| 400 | Invalid ID, username or pagination |
| 401 | Missing/invalid/expired/revoked Bearer, insufficient scope or inactive token owner |
| 404 | Missing, inactive, deleted, blocked or insufficiently public target |
| 429 | IP/token limit or integration quota |
| 500 | Query failure |
| 503 | Integration service unavailable |

OAuth errors use JSON `error` and `error_description`; validation, visibility and query errors use text. Existing [OAuth quotas and limits](../rate-limits.md) apply, with operation metrics `users.profile`, `users.library`, `users.activity` and `users.collections`.
