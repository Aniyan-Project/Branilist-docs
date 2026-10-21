# Límites, caché y CORS

[Índice](README.md) · [Errores](errors.md)

## Límites de referencia

Valores de la implementación revisada; la infraestructura y la configuración de la aplicación pueden imponer otros límites. El limitador utiliza ventanas de un minuto, no una garantía de disponibilidad.

| Acceso | Límite |
| --- | --- |
| Detalles anónimos, incluidos MAL/AniList | 240 llamadas/minuto por IP, compartidas entre las tres rutas |
| Búsqueda pública anónima | 120 llamadas/minuto por IP |
| Endpoints OAuth de usuario | 300 llamadas/minuto por token, compartidas |
| Emisión/renovación en `/oauth/token` | 120 llamadas/minuto por client ID |
| Capa adicional de aplicación autenticada | Configurable por aplicación **y operación**, inicialmente 120/minuto |
| Cuota diaria de la aplicación | Configurable, inicialmente 10.000 solicitudes |

API keys y OAuth comparten la cuota diaria de la aplicación. Las llamadas que reservan cuota cuentan aunque después fallen o se resuelvan desde caché. Los errores anteriores a la reserva no necesariamente cuentan.

## Cabeceras de uso

Cuando la capa de cuota está activa:

| Cabecera | Significado |
| --- | --- |
| `X-RateLimit-Limit` | **Cuota diaria**, no límite por minuto |
| `X-RateLimit-Remaining` | Solicitudes diarias restantes tras reservar la llamada |
| `X-RateLimit-Reset` | Timestamp Unix de la próxima medianoche UTC informada por la API |
| `Retry-After` | Segundos de espera; presente en algunos rechazos por minuto |

Estas cabeceras pueden faltar en llamadas anónimas o rechazos anticipados. El cómputo diario utiliza la fecha de la base de datos; consulta el panel si el reinicio anunciado difiere de la ventana efectiva.

## Caché del catálogo

| Ruta | `Cache-Control` |
| --- | --- |
| Detalles por ID interno/MAL/AniList | `public, max-age=30, stale-while-revalidate=120` |
| Búsqueda pública | `public, max-age=15, stale-while-revalidate=60` |
| Búsqueda autenticada | `private, no-store` |
| Eliminación de biblioteca / emisión de tokens | `no-store` |

El catálogo usa `X-Branilist-Cache: HIT` o `MISS`. La duración de la caché interna es configurable y puede diferir de `max-age`. Cada proveedor tiene entradas de caché separadas, por lo que los cambios pueden aparecer en momentos diferentes. No se garantiza lectura inmediata tras una escritura.

No uses caché compartida para respuestas personales, aunque una ruta no envíe `no-store`. No presupongas soporte de ETag, `If-None-Match` ni 304.

## CORS

`/api/v1`, `/oauth/token` y `/oauth/revoke` permiten origen `*`, sin credenciales de cookies. Usa Bearer con `fetch` sin `credentials: 'include'`.

El navegador puede leer `X-Request-ID` y `X-Branilist-Cache`, pero `X-RateLimit-*` y `Retry-After` no están expuestos por CORS. Los clientes de servidor sí pueden leerlos. `X-Branilist-API-Key` tampoco está permitido en preflight; úsalo en el backend.

CORS anuncia GET, POST, PUT, PATCH, DELETE y OPTIONS. Eso no crea rutas PATCH en v1. Un OPTIONS correcto no concede autorización para la operación.
