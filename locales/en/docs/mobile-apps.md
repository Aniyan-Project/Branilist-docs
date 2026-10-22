# Mobile applications

[Index](README.md) · [GraphQL](graphql.md) · [OAuth and PKCE](authentication.md)

Use `POST https://branilist.com/api/graphql` for catalog and library applications. Public GraphQL uses OAuth credentials, not the website's session cookies.

## Native authorization

Register a **PUBLIC** application with an HTTPS callback you control. Configure Android App Links or iOS Universal Links for that address. Enable only the required scopes in the application settings; new permissions are not automatically granted to existing applications or tokens.

Generate fresh `state`, `code_verifier` and S256 `code_challenge` values for every attempt. Open authorization in the system browser, validate the returned state, and exchange the code at `/oauth/token` using the exact same callback and verifier. PUBLIC apps must not embed a client secret or collect the user's password.

Store tokens in platform secure storage. Refresh tokens rotate: replace the stored token after every refresh and serialize refresh requests. Revoke the token through `/oauth/revoke` and clear account-specific local data when signing out. See [OAuth](authentication.md) for request parameters.

Redirects must exactly match a registered address. Custom URI schemes such as `myapp://callback` are not currently accepted; use claimed HTTPS links.

## Catalog discovery

`mediaPage` supports `search`, `type`, `first`, `offset`, `filter` and `sort`. Filters combine a genre slug, year range, season, format and status. Years must be 1900–2200 and the lower bound cannot exceed the upper bound. Default sorting remains `ID_DESC`.

```graphql
query Explore {
  mediaPage(type: ANIME, filter: {yearFrom: 2020, genre: "action", status: FINISHED}, sort: SCORE_DESC, first: 12) {
    nodes { id title { romaji english } coverImage averageScore }
    pageInfo { hasNextPage offset limit }
  }
  trendingMedia(type: ANIME, days: 30, first: 6) { id title { romaji } }
}
```

Resolve work links with `mediaBySlug(slug:, type:)`. `trendingMedia` accepts 1–90 days and 1–30 results. `media.similar(first:)` returns related recommendations; `viewer.recommendations(first:)` uses the token owner's library and requires `library:read`. Recommendations accept 1–30 results and may return fewer after adult-content filtering.

## Personal library and statistics

```graphql
query MyLibrary {
  viewer {
    libraryPage(search: "Frieren", type: ANIME, sort: UPDATED, first: 20) {
      nodes { mediaId status progress score private media { title { romaji } } }
      pageInfo { hasNextPage }
    }
    libraryInsights {
      mediaCount animeCount mangaCount completedCount
      episodesConsumed chaptersConsumed estimatedWatchMinutes averageScore
      statuses { key label count percentage }
    }
  }
}
```

Both fields require `library:read`. Filter `libraryPage` by search, status and media type; sort by update, title, score, progress, start or completion. Search accepts up to 200 characters and treats `%` and `_` literally. Insights cover the complete personal library, with genre, format, year, status, score, country and studio distributions. Their average-score scale follows the website's insights service; individual `LibraryEntry.score` remains 0.5–10.

Use [saveLibraryEntry](graphql.md) for progress, rating and status. This mutation preserves omitted fields.

## Favourites

`viewer.favourites(type:, first:, offset:)` requires `favourites:read`. Types are `MEDIA`, `STAFF`, `STUDIO` and `CHARACTER`; each result includes its ID, position and corresponding catalog object.

```graphql
mutation Favourite($id: ID!) {
  setFavourite(type: MEDIA, id: $id, enabled: true) { type id enabled }
}
```

Writes require `favourites:write`. Repeating `setFavourite` with the same state keeps that state: `true` adds and `false` removes. `reorderFavourites(type:, ids:)` puts 1–200 distinct IDs at the front, preserving the relative order of all remaining favourites. Every ID must already be a favourite of the token owner.

## Collections

`collection(id:)`, `publicCollections(search:, type:, first:, offset:)` and collection contents require `collections:read`. Public discovery includes only PUBLIC collections belonging to active accounts with PUBLIC profiles and lists and no blocks in either direction. Owners may access their private collections by ID or through `viewer.collections`.

```graphql
mutation CreateCollection {
  createCollection(input: {mediaType: ANIME, name: "Weekend watchlist", visibility: PRIVATE, tags: ["short"]}) {
    id name visibility
  }
}
```

`createCollection`, `updateCollection`, `deleteCollection` and `setCollectionItem` require `collections:write` and only modify the token owner's collections. Per-type account limits, including VIP benefits, match the website.

`updateCollection` **replaces metadata**: provide the desired name, description, color, visibility, tags, cover and position. Omitted optional fields are cleared or use their defaults; existing items remain unchanged. Cover media and items must match the collection's media type. Names accept 1–60 characters, descriptions up to 500, and tags up to 8 values with 24 characters each.

`setCollectionItem(collectionId:, mediaId:, enabled:, position:, note:)` adds, updates or removes an item. Position and note replace their previous values; notes accept up to 500 characters and are not exposed by the public API. `deleteCollection` returns `false` if it removes no collection owned by the token owner.

## Profile, preferences and privacy

| Resource | Read | Write |
| --- | --- | --- |
| Profile | `viewer.profile`, `profile:read` | `updateProfile`, `profile:write` |
| Preferences | `viewer.preferences`, `preferences:read` | `savePreferences`, `preferences:write` |
| Privacy | `viewer.privacy`, `privacy:read` | `savePrivacy`, `privacy:write` |

`updateProfile` replaces display name, biography, avatar and banner. Omitted biography/image URLs are cleared; omitted banner positions are preserved. Names accept 1–60 characters, biographies up to 10000 and banner positions 0–100. Images must be uploads owned by the token owner; public GraphQL does not upload files. Profile updates share the website's limit of 20 per user per hour.

`savePreferences` receives an enabled locale, title language, theme and adult-content preference. Omitting `darkTheme` preserves it; explicit `null` is invalid. Enabling adult visibility takes effect on the next request; hiding it takes effect immediately.

`savePrivacy` receives profile, list and activity visibility (`PUBLIC`, `FOLLOWERS` or `PRIVATE`). Read scopes never imply write permission. Read mutation results to confirm the persisted state.

## Contract boundaries

Existing [privacy, pagination, cost and error rules](graphql.md) apply. Multiple mutation fields have separate transactions. For offline use, verify state after network failures and avoid indiscriminate retries; this API does not provide incremental synchronization or automatic conflict resolution.

Feed, followers, posts, reviews, comments and notifications are covered by the [community guide](community.md). Forums, push and sensitive account management are outside these operations. Isolate credentials by account and inspect GraphQL errors even on HTTP 200.
