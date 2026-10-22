# Branilist Public API

Documentação da API pública REST do [Branilist](https://branilist.com). Consulte anime e mangá, conecte uma conta com OAuth e gerencie a biblioteca do usuário com consentimento.

**API v1 · REST/JSON · OAuth 2.0 + PKCE · Português / English / Español**

**[Ler a documentação no site →](https://aniyan-project.github.io/Branilist-docs/guide/introduction.html)**

[Português](https://aniyan-project.github.io/Branilist-docs/guide/introduction.html) · [English](https://aniyan-project.github.io/Branilist-docs/en/guide/introduction.html) · [Español](https://aniyan-project.github.io/Branilist-docs/es/guide/introduction.html)

```sh
curl --fail-with-body 'https://branilist.com/api/v1/search?q=frieren&limit=5'
```

## Comece por aqui

| Quero… | Leia |
| --- | --- |
| Fazer minha primeira consulta | [Início rápido](docs/getting-started.md) |
| Conectar uma conta | [OAuth e PKCE](docs/authentication.md) |
| Usar uma API key no servidor | [API keys](docs/api-keys.md) |
| Encontrar mídia por ID Branilist, MyAnimeList ou AniList | [Catálogo e busca](docs/reference/catalog.md) |
| Ler, atualizar ou remover itens da biblioteca | [Biblioteca](docs/reference/library.md) |
| Ler perfil, histórico e coleções | [Conta do usuário](docs/reference/account.md) |
| Consultar dados públicos de outra pessoa | [Usuários públicos](docs/reference/public-users.md) |
| Entender os campos das respostas | [Modelos e convenções](docs/reference/models.md) |
| Tratar falhas e limites | [Erros](docs/errors.md) · [Limites e cache](docs/rate-limits.md) |
| Receber eventos | [Webhooks](docs/webhooks.md) |
| Testar com JavaScript ou uma ferramenta de API | [Exemplos](docs/examples.md) · [OpenAPI](openapi.json) |

## Endereços

| Recurso | URL |
| --- | --- |
| Origem usada nos exemplos | `https://branilist.com` |
| API REST | `https://branilist.com/api/v1` |
| Autorização no navegador | `https://branilist.com/oauth/authorize` |
| Emissão e renovação de tokens | `https://branilist.com/oauth/token` |
| Revogação de token | `https://branilist.com/oauth/revoke` |
| Painel de desenvolvedores | [branilist.com/settings/developer](https://branilist.com/settings/developer) |
| Apresentação da API | [branilist.com/developers](https://branilist.com/developers) |

## O que está documentado

As operações REST em `/api/v1`, os endpoints de tokens e o fluxo de consentimento no navegador. As APIs de sessão do site, administração, GraphQL e extensão têm contratos próprios e não são intercambiáveis com esta API. A lista de operações do site é gerada a partir do OpenAPI a cada publicação.

Esta documentação foi conferida com a implementação em **21 de outubro de 2026**. Exemplos com mídias, perfis e IDs são ilustrativos; o catálogo e a implantação podem mudar. Consulte o [histórico](docs/changelog.md) e as [limitações atuais](docs/faq.md).

## Navegação e contribuição

- [Índice completo](docs/README.md)
- [Como contribuir e validar a documentação](CONTRIBUTING.md)
- [Relatar um problema na documentação](https://github.com/Aniyan-Project/Branilist-docs/issues)

O conteúdo é mantido em Markdown para leitura e revisão diretamente no GitHub. O site usa VitePress e é publicado automaticamente no GitHub Pages. Operações e modelos são gerados de `openapi.json`; páginas Markdown entram automaticamente na navegação. Veja [como publicar e adicionar rotas](docs/publishing.md).

A organização é inspirada no [repositório de documentação do AniList](https://github.com/AniList/docs); o contrato descrito aqui é o do Branilist.
