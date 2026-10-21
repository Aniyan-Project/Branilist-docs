# Inicio rápido

[Índice](README.md) · Siguiente: [OAuth](authentication.md)

## 1. Consulta la versión

```sh
curl --fail-with-body 'https://branilist.com/api/v1'
```

```json
{"name":"Branilist Public API","version":"v1","oauth":"/oauth/token","authorize":"https://branilist.com/oauth/authorize","docs":"https://branilist.com/developers"}
```

## 2. Busca un contenido

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/search' \
  --data-urlencode 'q=frieren' --data-urlencode 'limit=5'
```

La respuesta es `{ "items": [...] }`. Utiliza `items[i].id` para consultar los detalles:

```sh
# Sustituye 123 por un ID devuelto por la búsqueda.
curl --fail-with-body 'https://branilist.com/api/v1/media/123'
```

## 3. Elige la autenticación

| Objetivo | Credencial |
| --- | --- |
| Consultas públicas ocasionales | Ninguna; se aplican límites por IP |
| Integración del catálogo en tu servidor | API key con `catalog:read` y/o `search:read` |
| Acceder a la cuenta y biblioteca de una persona | Access token OAuth con los permisos autorizados |

Crea una aplicación en el [panel](https://branilist.com/settings/developer). Para cuentas de usuarios, implementa el [flujo OAuth](authentication.md). Una API key no sustituye el consentimiento del usuario.

## 4. Lee la biblioteca autorizada

Después de completar OAuth, utiliza un access token con `library:read`:

```sh
export BRANILIST_ACCESS_TOKEN='SUSTITUYE_POR_EL_ACCESS_TOKEN'
curl --fail-with-body 'https://branilist.com/api/v1/me/library' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

Solicita `library:write` por separado para actualizar o eliminar entradas. Los ejemplos de shell usan sintaxis POSIX; en PowerShell, accede a la variable con `$env:BRANILIST_ACCESS_TOKEN`.

## Antes de integrar

- Utiliza HTTPS y procesa los errores antes de consumir los resultados.
- Conserva los campos `null`; no todos los títulos tienen traducción.
- Distingue los IDs internos de los IDs MAL/AniList.
- Revisa los [errores](errors.md), [límites](rate-limits.md) y las [reglas de actualización](reference/library.md).
