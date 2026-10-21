# Contribuir

Ayuda a mantener esta referencia precisa y útil.

## Preparación

```sh
git clone https://github.com/Aniyan-Project/Branilist-docs.git
cd Branilist-docs
npm ci
npm run check
npm run docs:build
```

Usa Node.js 22+. El Markdown sigue siendo legible en GitHub; VitePress genera el sitio estático. Consulta la [guía de publicación](docs/publishing.md).

## Cambiar el contrato

1. Verifica el comportamiento con la API o sus responsables, no con reglas de otro servicio.
2. Actualiza OpenAPI, referencias afectadas, guías y traducciones juntas.
3. Incluye ejemplos representativos e identifica claramente los datos e IDs ilustrativos.
4. Registra cambios significativos en el historial.
5. Ejecuta las comprobaciones y revisa el Markdown renderizado.

## Convenciones editoriales

- Conserva nombres de campos, códigos HTTP, scopes y enumeraciones exactos en todos los idiomas.
- Documenta método, ruta, autenticación, parámetros, respuestas y errores.
- Distingue los requisitos del servidor de las recomendaciones para clientes.
- Indica limitaciones e inconsistencias sin inventar funciones.
- Usa enlaces relativos y mantén las versiones de idioma alineadas.
- No publiques tokens, secretos, datos personales, volcados ni código privado.
- Los ejemplos ejecutables no deben modificar cuentas por defecto.

## Informar de un problema

Abre un [issue de documentación](https://github.com/Aniyan-Project/Branilist-docs/issues) con la página y el comportamiento observado/esperado. Elimina tokens y datos personales. Envía informes de seguridad de forma privada por el canal del equipo, nunca en un issue público.

La validación local no demuestra disponibilidad del despliegue ni sustituye la revisión del contrato por sus responsables.
