# Errors and recovery

[Index](README.md) · [Limits](rate-limits.md) · [FAQ](faq.md)

The current API has **two error formats**. Check the status and `Content-Type` before parsing the body.

## OAuth, key, and quota JSON errors

```json
{"error":"invalid_token","error_description":"token ausente, expirado ou sem escopo"}
```

API error messages themselves are not localized by the documentation language selector.

| Code | Usual status | Action |
| --- | --- | --- |
| `invalid_request` | 400 | Review OAuth form fields and parameters |
| `unsupported_grant_type` | 400 | Use a supported grant |
| `invalid_grant` | 400 | Check code/verifier/redirect or start a new authorization |
| `invalid_client` | 401 | Verify client ID and secret |
| `invalid_token` | 401 | Check validity, revocation, and scopes |
| `invalid_api_key` | 401 | Check the key and its scope |
| `slow_down` | 429 | Wait before issuing more tokens |
| `rate_limited` | 429 | Respect the rate-limit window |
| `quota_exceeded` | 429 | Wait for quota renewal or check app settings |
| `quota_unavailable` | 503 | Retry later with backoff |

## Plain text

Validation and database failures may return `text/plain; charset=utf-8`:

```text
invalid media id
```

Examples include `q must have at least 2 chars` (400), `not found` (404), `query failed` (500), `update failed` (500), and `integration unavailable` (503).

Not all failures are JSON. Proxies may return their own error bodies. Use `X-Request-ID`, when present, to correlate failures without sharing tokens.

## Current endpoint differences

- Public OAuth endpoints report insufficient scope as **401**, not 403.
- Legacy profile, authenticated search, library read/update, history, and collections handlers run the limiter before authentication. An absent or empty Bearer can produce **429 `rate_limited`**; this does not prove quota was consumed. Check your header before retrying.
- `DELETE /me/library/{mediaId}` explicitly returns **401** for an empty token.
- PUT with a nonexistent internal media ID may return **500** rather than 404.
- DELETE without an entry returns **200** with `removed: false`.
- CORS, proxies, and infrastructure can reject requests before they reach a handler.

## Safe retries

Retry reads after transient failures with exponential backoff and jitter; respect `Retry-After` when available. Do not automatically retry an uncertain write without checking the saved state. Library DELETE is idempotent. PUT has no documented idempotency-key or version-check contract. Never reuse a consumed OAuth code or refresh token.

The [example client](../../../examples/request.mjs) handles JSON and text errors without including tokens in its error message.
