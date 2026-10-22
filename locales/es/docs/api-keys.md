# API keys

Consulta los [Términos de Uso de la API](terms-of-use.md) antes de utilizar los recursos de integración.

[Índice](README.md) · [OAuth](authentication.md) · [Límites](rate-limits.md)

Utiliza API keys para las consultas del catálogo desde tu servidor. Crea y gestiona las claves dentro de la aplicación correspondiente en el [panel](https://branilist.com/settings/developer).

| Scope | Endpoints |
| --- | --- |
| `catalog:read` | Detalles por ID Branilist, MyAnimeList o AniList |
| `search:read` | Búsqueda pública `/api/v1/search` |

```sh
export BRANILIST_API_KEY='SUSTITUYE_POR_LA_API_KEY'
curl --fail-with-body 'https://branilist.com/api/v1/media/123' \
  -H "X-Branilist-API-Key: $BRANILIST_API_KEY"
```

Una clave válida asocia la llamada a la aplicación y aplica sus límites y cuota. Una clave inválida o sin permiso devuelve `401 invalid_api_key`; la llamada no se procesa después como anónima.

## Guardar y sustituir claves

- Guarda el secreto mostrado al crearla en variables de entorno o un gestor de secretos.
- No lo incluyas en código de navegador, aplicaciones distribuidas, URLs, ejemplos públicos ni repositorios.
- Rota o revoca claves desde el panel cuando sea necesario y comprueba la sustitución en tu entorno.
- La clave no identifica a un usuario final ni autoriza leer o modificar su biblioteca.

## Navegador y CORS

El preflight CORS actual no permite `X-Branilist-API-Key`. Mantén la clave en el backend. Las integraciones de usuario en el navegador deben usar OAuth y enviar el access token en `Authorization`.
