# OAuth 2.0 con PKCE

Consulta los [Términos de Uso de la API](terms-of-use.md) antes de utilizar los recursos de integración.

[Foro y Spaces](forum.md)
[Índice](README.md) · [API keys](api-keys.md) · [Ejemplo PKCE](../../../examples/pkce.mjs) · [Comunidad, reviews y notificaciones](community.md)

Branilist utiliza **Authorization Code + PKCE S256**. La autorización se realiza en el navegador; el intercambio y la renovación usan formularios HTTP. No solicites la contraseña de Branilist al usuario.

## Registrar la aplicación

Registra la aplicación y las URLs de retorno en el [panel de desarrolladores](https://branilist.com/settings/developer).

| Tipo | Uso | Client secret |
| --- | --- | --- |
| `PUBLIC` | Aplicaciones distribuidas o clientes que no pueden guardar secretos | No se requiere |
| `CONFIDENTIAL` | Backend que almacena credenciales de forma segura | Obligatorio al intercambiar y renovar |

Puedes registrar de 1 a 8 redirect URIs. Deben usar HTTPS, salvo HTTP en `localhost`, `127.0.0.1` y `::1`. No se permiten fragmentos, credenciales incrustadas ni comodines. La URI debe coincidir exactamente durante la autorización y el intercambio, incluida la ruta, el puerto y la barra final.

## Permisos públicos

| Scope | Permiso |
| --- | --- |
| `profile:read` | Leer el perfil del propietario del token |
| `library:read` | Leer su biblioteca y usar la búsqueda autenticada |
| `library:write` | Crear, actualizar o eliminar entradas |
| `activity:read` | Leer el historial personal |
| `collections:read` | Leer las colecciones del propietario del token |

Separa los scopes con espacios. Solicita solo los necesarios y comprueba que la aplicación los permite. `library:write` no concede `library:read` implícitamente. `profile`, `list:read` y `list:write` pertenecen a la extensión y no sustituyen los permisos anteriores.

## Flujo completo

1. Genera un `state` impredecible, un `code_verifier` aleatorio y su `code_challenge`.
2. Guarda `state` y el verifier asociados a ese intento de autorización.
3. Abre la página de autorización en el navegador.
4. En el callback, valida `state`, procesa los rechazos y después intercambia `code`.
5. Guarda ambos tokens y elimina los datos temporales del intento.

### Generar PKCE

El verifier tiene de 43 a 128 caracteres de `A-Z`, `a-z`, `0-9` y `-._~`.

```text
code_challenge = BASE64URL_SIN_PADDING(SHA256(code_verifier))
code_challenge_method = S256
```

El challenge tiene 43 caracteres. No se acepta `plain`. Usa el [generador de ejemplo](../../../examples/pkce.mjs) y un verifier nuevo en cada intento.

### Autorizar en el navegador

```text
https://branilist.com/oauth/authorize
  ?response_type=code
  &client_id=TU_CLIENT_ID
  &redirect_uri=https%3A%2F%2Ftu-app.example%2Fcallback
  &scope=profile%3Aread%20library%3Aread%20library%3Awrite
  &state=VALOR_ALEATORIO
  &code_challenge=CHALLENGE_S256
  &code_challenge_method=S256
```

La URL está dividida para facilitar la lectura; envíala como una sola URL codificada. El usuario inicia sesión y autoriza los permisos en Branilist.

Callback correcto: `?code=...&state=...`. Rechazo: `?error=access_denied&state=...`. El código caduca a los **10 minutos** y solo puede usarse una vez. Tu cliente debe generar y validar `state`.

### Intercambiar el código

```sh
curl --fail-with-body 'https://branilist.com/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'client_id=TU_CLIENT_ID' \
  --data-urlencode 'code=CODIGO_DEL_CALLBACK' \
  --data-urlencode 'redirect_uri=https://tu-app.example/callback' \
  --data-urlencode 'code_verifier=VERIFIER_DEL_MISMO_INTENTO'
```

Para `CONFIDENTIAL`, envía también `client_secret` en el formulario o utiliza HTTP Basic con el client ID como usuario y el secret como contraseña. Basic tiene prioridad sobre los valores del formulario. No envíes JSON a este endpoint.

```json
{"access_token":"ACCESS_TOKEN_ILUSTRATIVO","token_type":"Bearer","expires_in":3600,"refresh_token":"REFRESH_TOKEN_ILUSTRATIVO","scope":"library:read library:write profile:read"}
```

El orden de los scopes no importa. La respuesta incluye `Cache-Control: no-store`.

## Usar el access token

```http
Authorization: Bearer ACCESS_TOKEN
```

El token identifica al usuario. Las cookies de sesión y las API keys no lo sustituyen en los endpoints `/api/v1/me`.

## Renovar los tokens

Los access tokens caducan en **1 hora**. Los refresh tokens caducan en **30 días** y se rotan.

```sh
curl --fail-with-body 'https://branilist.com/oauth/token' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode 'client_id=TU_CLIENT_ID' \
  --data-urlencode 'refresh_token=TU_REFRESH_TOKEN'
```

Los clientes confidenciales también envían el secret. Guarda el nuevo par de forma atómica: el refresh token anterior deja de funcionar. Coordina las renovaciones concurrentes. Renovar no permite ampliar scopes; nuevos permisos requieren otro consentimiento.

## Revocar

```sh
curl --fail-with-body 'https://branilist.com/oauth/revoke' \
  --data-urlencode 'token=TOKEN_A_REVOCAR'
```

Devuelve **200 sin cuerpo**, incluso para tokens desconocidos. Revoca el token indicado, no necesariamente su pareja. Para desconectar, revoca ambos o elimina la autorización desde la cuenta. La respuesta no demuestra que el token existiera.

## Diagnóstico

| Problema | Comprobación |
| --- | --- |
| Autorización inválida | `response_type=code`, client ID, URI exacta, scopes permitidos y S256 |
| `invalid_client` | Client ID y secret del cliente confidencial |
| `invalid_grant` | Código caducado/usado, verifier incorrecto, URI distinta o refresh revocado |
| `unsupported_grant_type` | Usa `authorization_code` o `refresh_token` |
| `slow_down` | Respeta el límite de emisión |

Consulta [errores](errors.md) para las diferencias de formato y estado entre endpoints.
