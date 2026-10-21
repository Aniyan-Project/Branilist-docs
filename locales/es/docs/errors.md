# Errores y recuperación

[Índice](README.md) · [Límites](rate-limits.md) · [Preguntas frecuentes](faq.md)

La API actual tiene **dos formatos de error**. Comprueba el estado y `Content-Type` antes de interpretar el cuerpo.

## Errores JSON de OAuth, claves y cuotas

```json
{"error":"invalid_token","error_description":"token ausente, expirado ou sem escopo"}
```

El selector de idioma de esta documentación no traduce los mensajes devueltos por la API.

| Código | Estado habitual | Acción |
| --- | --- | --- |
| `invalid_request` | 400 | Revisa el formulario y los parámetros OAuth |
| `unsupported_grant_type` | 400 | Usa un grant compatible |
| `invalid_grant` | 400 | Comprueba código/verifier/redirect o inicia otra autorización |
| `invalid_client` | 401 | Comprueba client ID y secret |
| `invalid_token` | 401 | Comprueba caducidad, revocación y permisos |
| `invalid_api_key` | 401 | Comprueba la clave y sus scopes |
| `slow_down` | 429 | Espera antes de emitir tokens |
| `rate_limited` | 429 | Respeta la ventana del límite |
| `quota_exceeded` | 429 | Espera a la renovación o revisa la configuración |
| `quota_unavailable` | 503 | Reintenta más tarde con espera progresiva |

## Texto plano

Las validaciones y los fallos de consulta pueden responder con `text/plain; charset=utf-8`:

```text
invalid media id
```

Otros ejemplos: `q must have at least 2 chars` (400), `not found` (404), `query failed` (500), `update failed` (500), `integration unavailable` (503).

No todos los errores son JSON. Un proxy también puede devolver su propio formato. Usa `X-Request-ID`, si existe, para correlacionar errores sin compartir tokens.

## Particularidades actuales

- La falta de scopes en las rutas públicas OAuth se informa como **401**, no 403.
- Los handlers antiguos de perfil, búsqueda autenticada, lectura/actualización de biblioteca, historial y colecciones ejecutan el limitador antes de autenticar. Bearer vacío o ausente puede producir **429 `rate_limited`**; eso no demuestra consumo de cuota. Comprueba tu cabecera antes de reintentar.
- `DELETE /me/library/{mediaId}` devuelve **401** explícitamente si falta el token.
- PUT de un contenido interno inexistente puede devolver **500** en lugar de 404.
- DELETE sin entrada devuelve **200** y `removed: false`.
- CORS, proxies e infraestructura pueden rechazar la llamada antes del handler.

## Reintentos seguros

Reintenta lecturas tras fallos transitorios con espera exponencial y variación aleatoria. Respeta `Retry-After` cuando esté disponible. No repitas escrituras inciertas sin releer el estado. DELETE de biblioteca es idempotente; PUT no ofrece idempotencia ni control de versión documentados. No reutilices códigos OAuth ni refresh tokens consumidos.

El [cliente de ejemplo](../../../examples/request.mjs) trata errores JSON y texto sin exponer tokens en el mensaje.
