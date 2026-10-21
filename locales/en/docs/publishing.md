# Publishing and automatic updates

[Index](README.md)

The VitePress site is hosted on [GitHub Pages](https://aniyan-project.github.io/Branilist-docs/), with local search, a sidebar, light/dark themes, and an OpenAPI-generated reference.

## Update flow

1. Edit `docs/`, `site/introduction.md`, or `openapi.json`.
2. Push the change to the documentation repository's `main` branch.
3. The **Publicar documentação** workflow validates content/examples, builds the site, and publishes it.

Pull requests validate/build without replacing production. The workflow can also be run manually in Actions. **Do not use `[skip ci]` for pushes that should publish**; if already used, dispatch the workflow manually.

## Document a new operation

Add its method under OpenAPI `paths`, with a unique `operationId`, `summary`, tag, authentication, parameters, and responses. Add `requestBody` and schemas when needed.

The build generates its page/sidebar entry, the operation index, parameter and schema tables, illustrative examples, JSON model pages, and search index. Changes regenerate pages; removal deletes stale generated pages. Keep `operationId` stable to retain URLs, and supply `example` values for more specific examples.

This pipeline does not inspect backend source. Reflect API changes in OpenAPI and behavior guides; business semantics cannot be inferred from a method/path alone.

## Add a guide

Create a `.md` file in `docs/` with an H1 title. It is discovered automatically. Files under `docs/reference/` join reference guides. Relative links work on GitHub and are rewritten during generation. Do not edit `.site/`; it is temporary output.

## Languages

Portuguese is the root locale; English lives under `/en/` and Spanish under `/es/`. Translated Markdown mirrors original paths under `locales/en/` and `locales/es/`. Generated reference text uses each locale's `messages.json`; field names, paths, scopes, enum values, and code examples remain API identifiers, not translated names.

Update translations when changing a guide or OpenAPI description. New guides without a translation show an explicit notice followed by Portuguese source; this avoids silently presenting untranslated text as a completed translation.

## Run locally

```sh
npm ci
npm run check
npm run docs:dev
```

For production preview:

```sh
npm run docs:build
npm run docs:preview
```

Restart `docs:dev` after adding/removing navigation files. Deployment always regenerates all content.

## Pages configuration and troubleshooting

Settings → Pages uses **GitHub Actions**. Only the deploy job has `pages: write` and `id-token: write`; build has repository read access. No personal token or private backend access is needed.

The base path is `/Branilist-docs/`. If renaming the repository or using a custom domain, update `base` and `sitemap.hostname` in `.vitepress/config.mts`.

| Symptom | Check |
| --- | --- |
| No published changes | Workflow, main branch, skip marker, deployment result |
| Build failed | Validation, Markdown links, JSON/schema references |
| Missing operation | OpenAPI path, method, unique operation ID |
| Broken CSS/navigation | Pages base prefix |
| Generic examples | Add `example` metadata in OpenAPI |
