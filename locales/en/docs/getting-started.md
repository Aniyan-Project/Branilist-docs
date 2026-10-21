# Quick start

[Index](README.md) · Next: [OAuth](authentication.md)

## 1. Check the version

```sh
curl --fail-with-body 'https://branilist.com/api/v1'
```

```json
{"name":"Branilist Public API","version":"v1","oauth":"/oauth/token","authorize":"https://branilist.com/oauth/authorize","docs":"https://branilist.com/developers"}
```

## 2. Search for media

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/search' \
  --data-urlencode 'q=frieren' --data-urlencode 'limit=5'
```

The result is `{ "items": [...] }`. Use `items[i].id` to retrieve details:

```sh
# Replace 123 with an ID returned by search.
curl --fail-with-body 'https://branilist.com/api/v1/media/123'
```

## 3. Choose authentication

| Goal | Credential |
| --- | --- |
| Occasional public queries | None; IP limits apply |
| Server-side catalog integration | API key with `catalog:read` and/or `search:read` |
| Access a person's account and library | OAuth access token with their consented scopes |

Create an application in [developer settings](https://branilist.com/settings/developer). For user accounts, implement the [OAuth flow](authentication.md). An API key does not replace user consent.

## 4. Read an authorized library

After completing OAuth, use an access token with `library:read`:

```sh
export BRANILIST_ACCESS_TOKEN='REPLACE_WITH_ACCESS_TOKEN'
curl --fail-with-body 'https://branilist.com/api/v1/me/library' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

Request `library:write` separately to update or remove entries. Shell examples use POSIX syntax; in PowerShell, access the environment variable with `$env:BRANILIST_ACCESS_TOKEN`.

## Before integrating

- Use HTTPS and handle unsuccessful responses before consuming the result.
- Preserve `null` fields; not every title has a translation.
- Distinguish internal IDs from MAL/AniList IDs.
- Review [errors](errors.md), [limits](rate-limits.md), and [library update rules](reference/library.md).
