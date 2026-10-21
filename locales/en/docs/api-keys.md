# API keys

[Index](README.md) · [OAuth](authentication.md) · [Limits](rate-limits.md)

Use API keys for catalog queries made by your server. Create and manage keys under the appropriate application in [developer settings](https://branilist.com/settings/developer).

| Scope | Endpoints |
| --- | --- |
| `catalog:read` | Details by Branilist, MyAnimeList, or AniList ID |
| `search:read` | Public search `/api/v1/search` |

```sh
export BRANILIST_API_KEY='REPLACE_WITH_API_KEY'
curl --fail-with-body 'https://branilist.com/api/v1/media/123' \
  -H "X-Branilist-API-Key: $BRANILIST_API_KEY"
```

A valid key associates requests with the application and applies its limits and quota. An invalid key or missing scope returns `401 invalid_api_key`; the request is not retried as anonymous.

## Store and replace keys

- Store the secret shown at creation in an environment variable or secret manager.
- Do not embed it in browser code, distributed applications, URLs, public examples, or repositories.
- Rotate or revoke keys through the dashboard when needed; verify the replacement in your environment.
- A key does not identify an end user or authorize access to their library.

## Browser and CORS

The current CORS preflight configuration does not allow `X-Branilist-API-Key`. Keep API keys on the backend. User-facing browser integrations should use OAuth access tokens in `Authorization`.
