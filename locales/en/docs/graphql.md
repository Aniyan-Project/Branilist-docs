# Public GraphQL API

[Index](README.md) · [OAuth and PKCE](authentication.md) · [SDL schema](../../../graphql/schema.graphql)

Use **`POST https://branilist.com/api/graphql`** with the dedicated integration schema. REST remains available at `/api/v1`. The site's `/graphql` endpoint has a different contract and authentication.

The [explorer](https://branilist.com/api/graphql/playground) supports schema discovery and operations. The website reference regenerates queries, mutations, types, arguments, defaults and enums from SDL on every build. The server also provides [SDL](https://branilist.com/api/graphql/schema.graphql) and GraphQL introspection.

## First request

```sh
curl --fail-with-body 'https://branilist.com/api/graphql' \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { mediaPage(search: \"Frieren\", first: 5) { nodes { id title { romaji english portuguese } coverImage } pageInfo { hasNextPage } } }"}'
```

Select the fields you need. `mediaPage` accepts optional search text, `type: ANIME` or `MANGA`, `first` and `offset`. Without search text it lists the catalog by descending internal ID. Literal search matches romaji, English, Portuguese and native titles, with 2–200 characters. IDs serialize as **GraphQL ID strings**, preserving 64-bit precision.

## Credentials and scopes

| Operation | Credential |
| --- | --- |
| Catalog, details, genres, studios, staff and characters | Anonymous access or API key; OAuth may also query |
| `media`, catalog without search and related entities with an API key | `catalog:read` |
| `mediaPage` with text and an API key | `search:read`; selected relationships require `catalog:read` |
| `user`, `viewer.profile` | OAuth `profile:read` |
| Libraries and `media.viewerEntry` | OAuth `library:read` |
| Published activity and personal history | OAuth `activity:read` |
| Collections and their contents | OAuth `collections:read` |
| Save or remove library entries | OAuth `library:write` |

Send `Authorization: Bearer ACCESS_TOKEN` or `X-Branilist-API-Key: API_KEY`, never both. API keys are for servers and cannot authorize personal data or mutations. Site cookies do not authenticate this API. Use the existing [OAuth PKCE flow](authentication.md), including refresh and revocation. Removing an app scope removes access to its corresponding fields.

`viewer` requires valid OAuth; each nested field enforces its scope. A token with only `library:read` can read its library without `profile:read`. `user` requires `profile:read` plus the scopes of selected nested resources. Nullable-field failures may produce partial `data` alongside `errors`.

## Media and relationships

```graphql
query MediaByProvider($malId: ID!) {
  media(malId: $malId) {
    id
    malId
    anilistId
    title { romaji portuguese }
    genres(first: 10) { nodes { id name } }
    relations(first: 5) { nodes { type media { id title { romaji } } } }
    studios(first: 5) { nodes { role studio { id name } } }
    staff(first: 5) { nodes { role staff { id name } } }
    characters(first: 5) { nodes { role character { id name } } }
  }
}
```

Provide **exactly one** of `id`, `malId` or `anilistId`. External IDs only use existing mappings; they do not import media. Missing, unmapped or adult-filtered media return `null`. Root queries `staff(id:)`, `character(id:)`, `studio(id:)` and `genres` expose catalog entities.

Catalog `averageScore` uses 0–100; personal `score` uses 0.5–10. Sanitize descriptions and bios before rendering them as HTML.

## Other users and your account

```graphql
query PublicUser($username: String!) {
  user(username: $username) {
    id
    username
    library(first: 5) { nodes { mediaId status progress media { title { romaji } } } }
    collections(first: 5) { nodes { id name items(first: 5) { nodes { id } } } }
  }
}
```

`user` accepts exactly one of `id` or `username`. `username: "123456"` is unambiguous; GraphQL does not infer whether an argument is a name or ID.

The target must be active, have a PUBLIC profile and have no blocks in either direction with the token owner. Libraries and collections require PUBLIC lists; activity additionally requires PUBLIC activity. Owner, follower and administrator exceptions do not bypass these public-only rules. Private entries and PRIVATE/UNLISTED collections are excluded.

`user.activity` contains only published MEDIA_LIST feed events with a current non-private entry. `viewer.activity` is personal audit history, including removal events. These use different models.

```graphql
query MyAccount {
  viewer {
    id
    scopes
    profile { username displayName }
    library(first: 10, status: CURRENT, type: ANIME) {
      nodes { mediaId progress score private }
      pageInfo { limit offset hasNextPage }
    }
    activity(first: 5) { nodes { eventType mediaId progressDelta } }
    collections(first: 5) { nodes { id name visibility } }
  }
}
```

`viewer` always represents the token owner, including their private entries and collections when scopes allow. Email, credentials, administrative permissions and site administration are absent from this schema.

## Create or update a library entry

```graphql
mutation SaveProgress($mediaId: ID!, $input: LibraryEntryInput!) {
  saveLibraryEntry(mediaId: $mediaId, input: $input) {
    mediaId status progress score repeatCount private startedAt
  }
}
```

```json
{"mediaId":"123","input":{"status":"CURRENT","progress":4,"score":8.5}}
```

Requires `library:write` and changes only the token owner's entry. Use the **internal media ID**, also returned by MAL/AniList lookups.

**Omitted fields are preserved**, including concurrent updates of different fields. New entries default to `PLANNING`, zero progress/repeats, null rating/dates and `private: false`. Explicitly sending `CURRENT`/`COMPLETED` may autofill absent dates.

- `progress` and `repeatCount`: nonnegative integers.
- `score`: `null` or 0.5–10 in 0.5 steps; null clears the rating.
- `startedAt` and `completedAt`: prefer `YYYY-MM-DD`; RFC3339 also works. `null` or `""` clears a date.
- Explicit null is invalid for `status`, `progress`, `repeatCount` and `private`; omit to preserve them.

REST PUT keeps its existing default-value semantics. Both APIs share the library write/history service. There is no version check: concurrent writes to the same field can still overwrite one another.

## Remove an entry

```graphql
mutation RemoveEntry($mediaId: ID!) {
  removeLibraryEntry(mediaId: $mediaId) { mediaId removed }
}
```

Requires `library:write`. Returns `removed: true` when deleted or false when already absent. Deletion and the REMOVED history event commit together; retries do not duplicate removal history. Catalog media, favorites and collections remain.

## Pagination, adult content and limits

Lists return `nodes` and `pageInfo { limit offset hasNextPage }`. `first`: 1–100, default 20; `offset`: 0–10000, default 0. Increase offset by first. Concurrent changes may shift pages; privacy/content filtering precedes pagination.

Adult content is hidden for anonymous/API-key access. OAuth requires the global setting and the token owner's adult-content preference to allow it. Batch-loading caches exist only within one request. Never share authenticated responses across accounts.

| Control | Limit |
| --- | --- |
| HTTP body | 64 KiB |
| Parser | 4000 tokens |
| Root fields, including aliases/fragments | 20 |
| Expanded fields | 2000 |
| Data depth | 12; schema introspection allows 20 |
| Complexity | 1500; page cost multiplies by `first` |
| Execution deadline | 10 seconds, including cancellation of database queries |
| IP | 120 requests/minute |
| OAuth token | 300/minute, using the shared REST token limiter |

Authenticated apps also use their configured minute limit and shared daily quota. Each admitted authenticated POST consumes one request, including validation/operation failures. Daily quota is shared with REST. CORS exposes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` and `Retry-After`. API responses use `Cache-Control: private, no-store`.

Keep nested pages small. Complexity checks may reject queries before database access. HTTP batching, uploads, subscriptions and cookie authentication are unsupported. Platform maintenance can block reads and/or mutations.

## HTTP and errors

Send JSON `query`, `variables` and, when necessary, `operationName`. Only POST executes operations. Always inspect `errors`, even on HTTP 200. `extensions.code` may be `UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`, `NOT_FOUND`, `QUERY_LIMIT_EXCEEDED`, `COMPLEXITY_LIMIT_EXCEEDED`, `RATE_LIMITED`, `QUOTA_EXCEEDED`, `SERVICE_UNAVAILABLE` or `TIMEOUT`. Internal failures do not expose SQL or credentials.

HTTP authentication failures return 401; limits/quota 429; unavailable maintenance/integrations 503; unsupported methods 405; declared bodies above the maximum 413. JSON, syntax and validation failures can return 4xx. Multiple root mutations in one operation execute sequentially, each with its own transaction; the entire GraphQL operation is not one transaction.

## Maintain the reference

Run the [Node.js client](../../../examples/graphql.mjs) with `node examples/graphql.mjs`. It only queries by default, detects GraphQL errors on HTTP 200, preserves partial data on errors and never retries operations automatically.

`graphql/schema.graphql` is the documentation's source. When changing the backend contract, copy `apps/api/internal/publicgraph/schema.graphqls` into it. Every build regenerates type/argument pages and three-language navigation, SDL downloads and JSON introspection. `npm run check` validates GraphQL examples against the schema.
