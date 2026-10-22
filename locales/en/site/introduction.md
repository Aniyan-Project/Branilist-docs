# Introduction

The **Branilist** public API connects your application to the anime and manga catalog and, with permission, a person's library. This documentation explains how to query data and connect an account using **REST, JSON, and OAuth 2.0 with PKCE**.

## Your first request

Start with public search, without creating credentials:

```sh
curl --fail-with-body 'https://branilist.com/api/v1/search?q=frieren&limit=5'
```

The response contains an `items` array. Use a media item's `id` to retrieve its details or manage a library entry with the appropriate scope.

## Explore the documentation

| I need to… | Start here |
| --- | --- |
| Build my first integration | [Quick start](../docs/getting-started.md) |
| Connect a user's account | [OAuth with PKCE](../docs/authentication.md) |
| Query the catalog from my server | [API keys](../docs/api-keys.md) |
| Look up MyAnimeList and AniList IDs | [Catalog and search](../docs/reference/catalog.md) |
| Update or remove library entries | [Personal library](../docs/reference/library.md) |
| Understand the API usage rules | [API Terms of Use](../docs/terms-of-use.md) |
| Handle errors and usage limits | [Errors](../docs/errors.md) and [rate limits](../docs/rate-limits.md) |
| Receive integration events | [Webhooks](../docs/webhooks.md) |

The **Reference** tab lists each operation, its parameters, request and response schemas, and examples generated from OpenAPI. Search also indexes guides and JSON models.

## API addresses

| Resource | Address |
| --- | --- |
| Public API v1 | `https://branilist.com/api/v1` |
| Browser consent | `https://branilist.com/oauth/authorize` |
| Token exchange and refresh | `https://branilist.com/oauth/token` |
| Register your integration | [Developer settings](https://branilist.com/settings/developer) |

::: tip IDs and examples
The catalog returns Branilist's internal ID. Even a lookup by MyAnimeList or AniList ID returns this internal identifier. Example data and IDs throughout the documentation are illustrative.
:::

## How this documentation stays up to date

Content comes from Markdown files and `openapi.json` on [GitHub](https://github.com/Aniyan-Project/Branilist-docs). Each update to the main branch regenerates navigation and reference pages and publishes the website automatically.

OpenAPI is the source for the endpoint reference. Backend changes must be reflected there to appear here. See the [maintenance guide](../docs/publishing.md) to add pages or document a new endpoint.
