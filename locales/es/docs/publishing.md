# Publicación y actualizaciones automáticas

[Índice](README.md)

El sitio VitePress está alojado en [GitHub Pages](https://aniyan-project.github.io/Branilist-docs/), con búsqueda local, barra lateral, temas claro/oscuro y referencia generada desde OpenAPI.

## Flujo de actualización

1. Edita `docs/`, `site/introduction.md` u `openapi.json`.
2. Envía el cambio a la rama `main` del repositorio de documentación.
3. El workflow **Publicar documentação** valida contenido y ejemplos, construye el sitio y lo publica.

Las pull requests validan y construyen sin reemplazar producción. También se puede ejecutar manualmente desde Actions. **No uses `[skip ci]` en cambios que deban publicar**; si ya lo usaste, ejecuta el workflow manualmente.

## Documentar una nueva operación

Añade el método en `paths` de OpenAPI, con `operationId` único, `summary`, tag, autenticación, parámetros y respuestas. Incluye `requestBody` y esquemas cuando corresponda.

La construcción genera la página y su navegación, índice de operaciones, tablas de parámetros y esquemas, ejemplos ilustrativos, modelos JSON e índice de búsqueda. Los cambios regeneran páginas; las eliminaciones quitan las páginas antiguas. Conserva `operationId` para mantener las URL y proporciona `example` para ejemplos más específicos.

Este proceso no inspecciona el backend. Refleja los cambios de API en OpenAPI y en las guías; el comportamiento de negocio no se deduce solo del método y ruta.

## Añadir una guía

Crea un `.md` en `docs/` con título H1. Se descubre automáticamente. Los archivos en `docs/reference/` forman parte de las guías de referencia. Los enlaces relativos funcionan en GitHub y se reescriben al generar. No edites `.site/`: es una salida temporal.

## Idiomas

El portugués usa la raíz; el inglés, `/en/`; el español, `/es/`. Los Markdown traducidos reflejan las rutas originales bajo `locales/en/` y `locales/es/`. La referencia generada usa el `messages.json` de cada idioma. Los nombres de campos, rutas, scopes, enumeraciones y ejemplos de código conservan los identificadores de la API.

Actualiza las traducciones al cambiar una guía o descripción OpenAPI. Las guías nuevas sin traducción muestran un aviso explícito seguido del original portugués, para no presentar contenido sin traducir como una traducción terminada.

## Ejecutar localmente

```sh
npm ci
npm run check
npm run docs:dev
```

Para previsualizar producción:

```sh
npm run docs:build
npm run docs:preview
```

Reinicia `docs:dev` al añadir o eliminar archivos de navegación. La publicación siempre regenera todo el contenido.

## Configuración y solución de problemas

Settings → Pages usa **GitHub Actions**. Solo el trabajo de publicación tiene `pages: write` e `id-token: write`; la construcción tiene lectura del repositorio. No necesita token personal ni acceso privado al backend.

La ruta base es `/Branilist-docs/`. Al renombrar el repositorio o usar dominio propio, actualiza `base` y `sitemap.hostname` en `.vitepress/config.mts`.

| Síntoma | Comprobar |
| --- | --- |
| Cambios sin publicar | Workflow, rama main, marcador skip y resultado |
| Fallo de construcción | Validación, enlaces Markdown y referencias JSON/esquemas |
| Operación ausente | Ruta OpenAPI, método e ID de operación único |
| CSS/navegación rotos | Prefijo base de Pages |
| Ejemplos genéricos | Añadir metadatos `example` en OpenAPI |
