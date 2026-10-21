# Contributing

Help keep this reference accurate and useful.

## Setup

```sh
git clone https://github.com/Aniyan-Project/Branilist-docs.git
cd Branilist-docs
npm ci
npm run check
npm run docs:build
```

Use Node.js 22+. Markdown remains readable on GitHub; VitePress generates the static website. See the [publishing guide](docs/publishing.md).

## Change the contract

1. Verify behavior against the API or with maintainers, not another service's rules.
2. Update OpenAPI, affected reference pages, guides, and translations together.
3. Include representative examples, clearly labeling illustrative IDs/data.
4. Record significant changes in the changelog.
5. Run checks and review Markdown rendering.

## Editorial conventions

- Preserve exact API field names, status codes, scopes, and enum values across languages.
- Document method, path, authentication, parameters, responses, and errors.
- Distinguish server requirements from client recommendations.
- State limitations and inconsistencies without inventing features.
- Use relative links and keep language versions aligned.
- Never publish tokens, secrets, personal data, dumps, or private product code.
- Executable examples must not change accounts by default.

## Report an issue

Open a [documentation issue](https://github.com/Aniyan-Project/Branilist-docs/issues) with the page and observed/expected behavior. Remove tokens and personal data. Send security reports privately through the team's available channel, not a public issue.

Local validation does not prove deployment availability or replace maintainer review of the API contract.
