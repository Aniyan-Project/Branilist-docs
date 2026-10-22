# OAuth 2.0 with PKCE

[Forum and Spaces](forum.md)
[Index](README.md) · [API keys](api-keys.md) · [PKCE example](../../../examples/pkce.mjs) · [Community, reviews and notifications](community.md)

Branilist uses **Authorization Code + PKCE S256**. Authorization happens in the browser; code exchange and token refresh use HTTP forms. Do not ask for the user's Branilist password.

## Register an application

Register your application and callback URLs in [developer settings](https://branilist.com/settings/developer).

| Type | Use case | Client secret |
| --- | --- | --- |
| `PUBLIC` | Distributed apps or clients that cannot keep secrets | Not required |
| `CONFIDENTIAL` | Backend that stores credentials securely | Required for code exchange and refresh |

Register 1–8 redirect URIs. HTTPS is required, except HTTP on `localhost`, `127.0.0.1`, and `::1`. Fragments, embedded credentials, and wildcards are rejected. Authorization and exchange must use an exact registered URI, including path, port, and trailing slash.

## Public scopes

| Scope | Permission |
| --- | --- |
| `profile:read` | Read the token owner's profile |
| `library:read` | Read their library and use authenticated search |
| `library:write` | Create, update, or remove library entries |
| `activity:read` | Read personal history |
| `collections:read` | Read the token owner's collections |

Separate scopes with spaces. Request only what you need and ensure the app allows those scopes. `library:write` does not implicitly grant `library:read`. Extension scopes `profile`, `list:read`, and `list:write` are separate and cannot replace this table's scopes.

## Complete flow

1. Generate an unpredictable `state`, a random `code_verifier`, and its `code_challenge`.
2. Store `state` and the verifier for this authorization attempt.
3. Open the authorization page in the browser.
4. On callback, verify `state`, handle denial, and only then exchange `code`.
5. Save both tokens and discard temporary attempt data.

### Generate PKCE

The verifier has 43–128 characters from `A-Z`, `a-z`, `0-9`, and `-._~`.

```text
code_challenge = BASE64URL_WITHOUT_PADDING(SHA256(code_verifier))
code_challenge_method = S256
```

The challenge has 43 characters. `plain` is not supported. Use the [example generator](../../../examples/pkce.mjs) and a fresh verifier per attempt.

### Authorize in the browser

```text
https://branilist.com/oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fyour-app.example%2Fcallback
  &scope=profile%3Aread%20library%3Aread%20library%3Awrite
  &state=RANDOM_VALUE
  &code_challenge=S256_CHALLENGE
  &code_challenge_method=S256
```

The URL is split across lines for readability; send one encoded URL. The user logs in and approves the requested permissions on Branilist.

Successful callback: `?code=...&state=...`. Denial: `?error=access_denied&state=...`. Codes expire after **10 minutes** and are single-use. Your client must generate and verify `state`.

### Exchange the code

```sh
curl --fail-with-body 'https://branilist.com/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'client_id=YOUR_CLIENT_ID' \
  --data-urlencode 'code=CALLBACK_CODE' \
  --data-urlencode 'redirect_uri=https://your-app.example/callback' \
  --data-urlencode 'code_verifier=VERIFIER_FROM_THE_SAME_ATTEMPT'
```

For `CONFIDENTIAL`, also send `client_secret` in the form or use HTTP Basic with the client ID as username and secret as password. Basic takes precedence over form values. Do not send JSON to the token endpoint.

```json
{"access_token":"ILLUSTRATIVE_ACCESS_TOKEN","token_type":"Bearer","expires_in":3600,"refresh_token":"ILLUSTRATIVE_REFRESH_TOKEN","scope":"library:read library:write profile:read"}
```

Scope ordering is irrelevant. Token responses include `Cache-Control: no-store`.

## Use the access token

```http
Authorization: Bearer ACCESS_TOKEN
```

The token identifies the user. Login cookies and API keys do not replace it on `/api/v1/me` endpoints.

## Refresh tokens

Access tokens last **1 hour**. Refresh tokens expire after **30 days** and rotate.

```sh
curl --fail-with-body 'https://branilist.com/oauth/token' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode 'client_id=YOUR_CLIENT_ID' \
  --data-urlencode 'refresh_token=YOUR_REFRESH_TOKEN'
```

Confidential clients also send the secret. Store the new token pair atomically: the previous refresh token can no longer be used. Coordinate concurrent refresh attempts. Refresh cannot expand scopes; new permissions require a new consent flow.

## Revoke a token

```sh
curl --fail-with-body 'https://branilist.com/oauth/revoke' \
  --data-urlencode 'token=TOKEN_TO_REVOKE'
```

Returns **200 without a body**, including for unrecognized tokens. It revokes the supplied token, not necessarily its pair. Revoke both access and refresh tokens, or remove the authorization in account settings, to disconnect. The response does not prove the token existed.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Invalid authorization | `response_type=code`, client ID, exact URI, allowed scopes, S256 challenge |
| `invalid_client` | Client ID and confidential client's secret |
| `invalid_grant` | Expired/used code, wrong verifier, URI mismatch, or revoked refresh token |
| `unsupported_grant_type` | Use `authorization_code` or `refresh_token` |
| `slow_down` | Respect the token issuance limit |

See [errors](errors.md) for endpoint-specific response formats and status differences.
