# Preguntas frecuentes y limitaciones

[Índice](README.md)

## ¿Es GraphQL, como AniList?

Branilist ofrece REST en `/api/v1` y una [API GraphQL pública separada](graphql.md) en `/api/graphql`, con OAuth y API keys. El `/graphql` del sitio tiene otro contrato y autenticación de sesión. No envíes queries GraphQL a las rutas REST.

## ¿Se requieren API keys para el catálogo?

No para las rutas públicas documentadas. El acceso anónimo tiene límites por IP. Las claves asocian las solicitudes de servidor con una aplicación, sus scopes y cuota.

## ¿Puedo buscar IDs de MyAnimeList o AniList?

Sí; consulta [Catálogo](reference/catalog.md). Branilist debe tener un vínculo existente. Usa el ID interno recibido para escribir en la biblioteca.

## ¿Por qué se reinició el progreso de la biblioteca?

PUT aplica cero al progreso/repeticiones omitidos y elimina puntuaciones omitidas. No es PATCH. Conserva los valores actuales antes de escribir.

## ¿Cómo filtro manga o respeto preferencias de contenido adulto?

Usa `/api/v1/me/search`, `library:read` y `type=MANGA`. La búsqueda pública no filtra por tipo ni aplica preferencias de cuenta solo porque se envió un token. Los detalles públicos pueden incluir `isAdult: true`; aplica las políticas de visualización de tu producto.

## ¿Cómo obtengo más de 500 entradas de biblioteca?

La ruta actual no ofrece paginación ni una forma documentada de recorrer el resto. El historial tiene un límite de 200; la búsqueda también tiene límites. No presentes estos resultados como una exportación completa garantizada.

## ¿Puedo crear colecciones, reseñas o favoritos?

Esas escrituras no forman parte del contrato `/api/v1` revisado. Los webhooks no implican que existan rutas públicas de escritura equivalentes.

## ¿Puede un access token administrar el panel de desarrolladores?

No. El registro de aplicaciones, las API keys, webhooks y métricas usan la sesión del propietario en el sitio, fuera de esta API OAuth pública.

## ¿Por qué JavaScript del navegador no puede leer cabeceras de cuota?

El CORS actual no las expone; eso no significa cuota ilimitada. Consulta [Límites y CORS](rate-limits.md).

## ¿Existe un sandbox o SLA?

Estas páginas no establecen sandbox, SLA, condiciones comerciales ni licencia del catálogo. Usa solo los entornos y condiciones proporcionados por el equipo. Los IDs ilustrativos no son datos de prueba públicos garantizados.

## ¿Qué puede cambiar?

Los campos, formatos y eventos pueden evolucionar. Ignora campos desconocidos y consulta el [registro de cambios](changelog.md). La fecha de revisión no garantiza que todos los despliegues tengan la misma revisión.
