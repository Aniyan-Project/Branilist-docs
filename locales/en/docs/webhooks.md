# Webhooks

[Index](README.md) · [Signature verifier](../../../examples/webhook-signature.mjs)

Webhooks send events to your integration's HTTPS server. Register the destination, application, and events in [developer settings](https://branilist.com/settings/developer). Management uses the owner's site session, not public `/api/v1` administration with an OAuth access token.

## Available events

| Event | Associated scope |
| --- | --- |
| `library.updated` | `library:read` |
| `review.created`, `review.updated`, `review.deleted` | `activity:read` |
| `collection.created`, `collection.updated`, `collection.deleted` | `collections:read` |

Personal event delivery depends on integration settings, authorization, and scopes. No public `library.deleted` event is documented. Not every account change necessarily produces a webhook. Payloads are not necessarily full REST objects; reread state when needed.

## Incoming request

```http
POST /your-webhook HTTP/1.1
Content-Type: application/json
User-Agent: Branilist-Webhooks/1.0
X-Branilist-Event: library.updated
X-Branilist-Delivery: 123
X-Branilist-Timestamp: 1792584000
X-Branilist-Signature: v1=HEX_HMAC_SHA256
```

```json
{"id":"evt_123","type":"library.updated","createdAt":"2026-10-21T12:00:00Z","data":{"userId":42,"mediaId":123}}
```

The illustrated `data` fields vary by event. The envelope contains `id`, `type`, `createdAt`, and `data`. Dashboard test deliveries use `integration.test`; handle that separately from subscribed event types.

## Verify signatures

```text
message = timestamp + "." + original_HTTP_body
signature = "v1=" + HEX(HMAC_SHA256(secret, message))
```

Use the timestamp header text and the original raw bytes before parsing JSON. Reserialization can change whitespace/property order and invalidate signatures.

The [Node.js example](../../../examples/webhook-signature.mjs) compares signatures in constant time and uses a 5-minute replay window. That window is an example policy, not a server requirement. Keep clocks synchronized and reject invalid timestamps.

## Acknowledge and deduplicate

- Return **2xx** after accepting a delivery. No response-body format is required.
- Persist events to a durable queue and do slow processing outside the request.
- Deduplicate by event/delivery ID; network failures may cause retries.
- Do not assume global ordering or exactly-once delivery. Manual retries may create a new delivery ID.

## Retries and destinations

Delivery has a **12-second** timeout and does not follow redirects. Register the final publicly accessible HTTPS URL. Loopback, private, and link-local networks are blocked, including after DNS resolution.

Retry delays are 1 minute, 5 minutes, 30 minutes, 2 hours, and 12 hours for later configured attempts. The delivery's configuration determines the attempt limit. Use the dashboard for failures, tests, and manual retries. Scheduling depends on the worker running.

Coordinate secret rotation between configuration and receiver. Do not log webhook secrets or access tokens.
