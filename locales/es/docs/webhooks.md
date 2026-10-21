# Webhooks

[Índice](README.md) · [Verificador de firmas](../../../examples/webhook-signature.mjs)

Los webhooks envían eventos al servidor HTTPS de tu integración. Registra el destino, la aplicación y los eventos en la [configuración de desarrolladores](https://branilist.com/settings/developer). La administración usa la sesión del propietario en el sitio, no un access token OAuth en `/api/v1`.

## Eventos disponibles

| Evento | Scope asociado |
| --- | --- |
| `library.updated` | `library:read` |
| `review.created`, `review.updated`, `review.deleted` | `activity:read` |
| `collection.created`, `collection.updated`, `collection.deleted` | `collections:read` |

La entrega de eventos personales depende de la configuración, autorización y scopes. No se documenta un evento público `library.deleted`. No todos los cambios de cuenta producen necesariamente un webhook. El payload puede diferir de los objetos REST completos; vuelve a consultar el estado cuando sea necesario.

## Solicitud recibida

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

Los campos ilustrativos de `data` varían por evento. El envoltorio contiene `id`, `type`, `createdAt` y `data`. Las pruebas del panel usan `integration.test`; trátalas por separado de los eventos suscritos.

## Verificar firmas

```text
message = timestamp + "." + original_HTTP_body
signature = "v1=" + HEX(HMAC_SHA256(secret, message))
```

Usa el texto de la cabecera timestamp y los bytes originales del cuerpo antes de analizar JSON. Volver a serializar puede cambiar espacios u orden de propiedades e invalidar la firma.

El [ejemplo Node.js](../../../examples/webhook-signature.mjs) compara firmas en tiempo constante y usa una ventana de 5 minutos contra repeticiones. Es una política de ejemplo, no un requisito del servidor. Sincroniza los relojes y rechaza timestamps inválidos.

## Confirmar y evitar duplicados

- Devuelve **2xx** tras aceptar una entrega. No se exige un formato de cuerpo de respuesta.
- Guarda eventos en una cola persistente y procesa el trabajo lento fuera de la solicitud.
- Evita duplicados por ID de evento/entrega; los fallos de red pueden provocar reintentos.
- No supongas orden global ni entrega exactamente una vez. Los reintentos manuales pueden crear un nuevo ID de entrega.

## Reintentos y destinos

La entrega tiene un timeout de **12 segundos** y no sigue redirecciones. Registra la URL HTTPS final y públicamente accesible. Se bloquean redes loopback, privadas y link-local, también después de resolver DNS.

Las esperas son 1 minuto, 5 minutos, 30 minutos, 2 horas y 12 horas para intentos posteriores configurados. La configuración de cada entrega determina el máximo. Usa el panel para fallos, pruebas y reintentos manuales. La programación depende de que el worker esté funcionando.

Coordina la rotación de secretos entre la configuración y el receptor. No registres secretos de webhook ni access tokens.
