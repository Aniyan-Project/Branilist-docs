# Introducción

La API pública de **Branilist** conecta tu aplicación con el catálogo de anime y manga y, con autorización, con la biblioteca de una persona. Esta documentación explica cómo consultar datos y conectar una cuenta mediante **REST, JSON y OAuth 2.0 con PKCE**.

## Tu primera solicitud

Puedes empezar con la búsqueda pública, sin crear credenciales:

```sh
curl --fail-with-body 'https://branilist.com/api/v1/search?q=frieren&limit=5'
```

La respuesta contiene un array `items`. Utiliza el `id` de un contenido para consultar sus detalles o gestionar una entrada de la biblioteca con el permiso adecuado.

## Explora la documentación

| Necesito… | Por dónde empezar |
| --- | --- |
| Crear mi primera integración | [Inicio rápido](../docs/getting-started.md) |
| Conectar la cuenta de un usuario | [OAuth con PKCE](../docs/authentication.md) |
| Consultar el catálogo desde mi servidor | [API keys](../docs/api-keys.md) |
| Consultar IDs de MyAnimeList y AniList | [Catálogo y búsqueda](../docs/reference/catalog.md) |
| Actualizar o eliminar entradas | [Biblioteca personal](../docs/reference/library.md) |
| Entender las reglas de uso de la API | [Términos de uso de la API](../docs/terms-of-use.md) |
| Gestionar errores y límites | [Errores](../docs/errors.md) y [límites](../docs/rate-limits.md) |
| Recibir eventos de la integración | [Webhooks](../docs/webhooks.md) |

La pestaña **Referencia** presenta cada operación, sus parámetros, los esquemas de solicitud y respuesta y ejemplos generados desde OpenAPI. La búsqueda también encuentra contenido de las guías y los modelos JSON.

## Direcciones de la API

| Recurso | Dirección |
| --- | --- |
| API pública v1 | `https://branilist.com/api/v1` |
| Consentimiento en el navegador | `https://branilist.com/oauth/authorize` |
| Intercambio y renovación de tokens | `https://branilist.com/oauth/token` |
| Registrar una integración | [Panel de desarrolladores](https://branilist.com/settings/developer) |

::: tip IDs y ejemplos
El catálogo devuelve el ID interno de Branilist. Incluso las consultas por MyAnimeList o AniList devuelven ese identificador. Los datos e IDs de ejemplo son ilustrativos.
:::

## Cómo se mantiene actualizada esta documentación

El contenido procede de archivos Markdown y de `openapi.json` en [GitHub](https://github.com/Aniyan-Project/Branilist-docs). Cada actualización de la rama principal regenera la navegación y la referencia y publica el sitio automáticamente.

OpenAPI es la fuente de la referencia de rutas. Los cambios del backend deben reflejarse allí para aparecer aquí. Consulta la [guía de mantenimiento](../docs/publishing.md) para añadir páginas o documentar nuevas rutas.
