# FAQ and limitations

[Index](README.md)

## Is this GraphQL, like AniList?

Branilist provides REST at `/api/v1` and a [separate public GraphQL API](graphql.md) at `/api/graphql`, using OAuth and API keys. The site's `/graphql` has a different contract and session authentication. Do not send GraphQL queries to REST endpoints.

## Are API keys required for the catalog?

Not for the documented public endpoints. Anonymous access has IP limits. Keys associate server requests with an app and its scopes/quota.

## Can I look up MyAnimeList or AniList IDs?

Yes; see [Catalog](reference/catalog.md). Branilist must already have a mapping. Use the returned internal ID for library writes.

## Why was library progress reset?

PUT applies default zero values for omitted progress/repeats and removes omitted ratings. It is not PATCH. Preserve the current values before writing.

## How do I filter manga or respect adult-content preferences?

Use `/api/v1/me/search`, `library:read`, and `type=MANGA`. Public search has no type filter and does not apply account preferences merely because a token was sent. Public details can include `isAdult: true`; apply your product's display policies.

## How do I fetch more than 500 library entries?

The current endpoint has no pagination or documented way to traverse the remainder. History is limited to 200; search is limited too. Do not describe these results as a guaranteed complete export.

## Can I create collections, reviews, or favorites?

Those writes are not in the reviewed `/api/v1` contract. Webhooks do not imply matching public write endpoints exist.

## Can an access token manage the developer dashboard?

No. App registration, API keys, webhook settings, and metrics use the owner's site session, outside this public OAuth surface.

## Why can't browser JavaScript read quota headers?

Current CORS does not expose them; that does not mean unlimited quota. See [Limits and CORS](rate-limits.md).

## Is there a sandbox or SLA?

These docs establish no sandbox, SLA, commercial terms, or catalog license. Use only environments and terms the team provides. Illustrative IDs are not public test fixtures.

## What can change?

Fields, formats, and events may evolve. Ignore unknown response fields and check the [changelog](changelog.md). The review date does not guarantee every deployment has the same revision.
