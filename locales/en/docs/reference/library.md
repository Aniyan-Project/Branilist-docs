# Personal library

[Index](../README.md) · [OAuth](../authentication.md) · [Models](models.md)

The access token determines the user. All operations use the **internal Branilist ID**, including after a MAL/AniList lookup.

| Method | Path | Scope |
| --- | --- | --- |
| GET | `/api/v1/me/library` | `library:read` |
| PUT | `/api/v1/me/library/{mediaId}` | `library:write` |
| DELETE | `/api/v1/me/library/{mediaId}` | `library:write` |

## GET /api/v1/me/library

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/library' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

Returns 200 with `items`, ordered by newest update. It includes up to **500 entries**, without pagination, filters, or cursors, including the token owner's private entries.

```json
{"items":[{"mediaId":123,"status":"CURRENT","progress":3,"score":8.5,"repeatCount":0,"startedAt":"2026-10-01T00:00:00Z","completedAt":null,"private":false,"updatedAt":"2026-10-21T12:00:00Z","media":{"id":123,"slug":"example-anime","type":"ANIME","title":{"romaji":"Example","english":"Example","portuguese":null},"coverImage":null}}]}
```

## PUT /api/v1/me/library/{mediaId}

Creates an entry or updates the existing one. Send `Content-Type: application/json`.

```sh
curl --fail-with-body -X PUT 'https://branilist.com/api/v1/me/library/123' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"status":"CURRENT","progress":3,"score":8.5,"repeatCount":0,"startedAt":"2026-10-01","private":false}'
```

| Field | Rule | If omitted |
| --- | --- | --- |
| `status` | Required: `PLANNING`, `CURRENT`, `COMPLETED`, `PAUSED`, or `DROPPED`; normalized to uppercase | Invalid request |
| `progress` | Nonnegative integer; episodes for anime, chapters for manga | **0**, even for existing entries |
| `score` | `null` or **0.5–10**, in **0.5** increments | **Removes the rating** |
| `repeatCount` | Nonnegative integer | **0**, even for existing entries |
| `startedAt` | `YYYY-MM-DD`, RFC3339, `null`, or empty string | Preserves it; `CURRENT` fills today's date if no date exists |
| `completedAt` | Same accepted formats | Preserves it; `COMPLETED` fills today's date if no date exists |
| `private` | Boolean for entry privacy | Preserved during updates; `false` during creation |

**PUT is not a partial patch.** Read and resend progress, rating, and repeat count to preserve them. There is no entry version check; coordinate concurrent writes in your integration.

To clear a date, explicitly send `null` or `""`. Dates are stored as calendar dates; prefer `YYYY-MM-DD`. Read responses serialize date fields as timestamps. The current public endpoint does not enforce episode/chapter totals or date ordering. Do not rely on missing validation to send inconsistent values.

Both creation and update return **200**:

```json
{"ok":true,"mediaId":123}
```

Effective changes are recorded in history. Private entries do not publish media-list activity to the feed. There is no textual-notes field in this payload.

Errors: 400 for invalid ID, JSON, or fields; 401 for invalid/insufficient token; 429 for limits/quota; 500 for update failure, including nonexistent internal media. Do not assume 404 for this write. See [error differences](../errors.md).

## DELETE /api/v1/me/library/{mediaId}

```sh
curl --fail-with-body -X DELETE 'https://branilist.com/api/v1/me/library/123' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

No body is needed. Only the token owner's entry is removed; media stays in the catalog. Favorites and collections are not deleted.

```json
{"ok":true,"mediaId":123,"removed":true}
```

If no entry exists, returns 200 with `removed: false`, including positive IDs without an entry for that user. Deletion and the `REMOVED` history event are saved in the same transaction. Repeating the call does not duplicate history. The response includes `Cache-Control: no-store`.

Errors: 400 for invalid IDs; 401 for absent, invalid, expired, revoked, or insufficient-scope tokens; 429 for limits/quota; 500 for deletion failure. Missing entries do not produce 204 or 404.
