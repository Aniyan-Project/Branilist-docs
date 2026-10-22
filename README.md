# Branilist Public API

Documentação das APIs públicas **REST e GraphQL** do [Branilist](https://branilist.com), com guias, referências e exemplos para criar integrações e aplicativos. Consulte o catálogo de anime e mangá e, com o consentimento do usuário via OAuth, gerencie biblioteca, favoritos, coleções, perfil e interações da comunidade.

**REST/JSON · GraphQL · OAuth 2.0 + PKCE · Português / English / Español**

**[Ler a documentação no site →](https://docs.branilist.com/guide/introduction.html)**

[Português](https://docs.branilist.com/guide/introduction.html) · [English](https://docs.branilist.com/en/guide/introduction.html) · [Español](https://docs.branilist.com/es/guide/introduction.html)

```sh
curl --fail-with-body 'https://branilist.com/api/v1/search?q=frieren&limit=5'
```

Consulte o catálogo com GraphQL e escolha os campos da resposta:

```sh
curl --fail-with-body 'https://branilist.com/api/graphql' \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { mediaPage(search: \"Frieren\", first: 5) { nodes { id title { romaji english portuguese } } pageInfo { hasNextPage } } }"}'
```

## Recursos das APIs

- **Catálogo:** busca, detalhes de anime e mangá, IDs MyAnimeList/AniList e relacionamentos; GraphQL também oferece filtros, recomendações, personagens, profissionais e estúdios.
- **Conta e biblioteca:** dados públicos de usuários, biblioteca pessoal, favoritos, coleções, perfil, preferências e privacidade, conforme os escopos de cada operação.
- **Comunidade via GraphQL:** feed, seguidores, publicações e respostas, reviews, comentários, curtidas e republicações.
- **Fórum via GraphQL:** categorias, tags, busca de tópicos, mensagens, reações, inscrições e participação em Spaces.
- **Notificações e proteção via GraphQL:** leitura e preferências pessoais, bloqueios, silenciamentos e denúncias, respeitando propriedade e visibilidade.
- **Integrações:** OAuth 2.0 com PKCE, API keys para operações compatíveis, webhooks assinados e referências geradas de OpenAPI e SDL GraphQL.

REST e GraphQL possuem contratos próprios. Consulte o guia de cada recurso para credenciais, escopos, limites e exemplos. As operações da conta usam a identidade do dono do token; o contrato público não oferece funções administrativas.

## Comece por aqui

| Quero… | Leia |
| --- | --- |
| Fazer minha primeira consulta | [Início rápido](docs/getting-started.md) |
| Usar GraphQL, relacionamentos e mutations | [Guia GraphQL](docs/graphql.md) · [Schema SDL](graphql/schema.graphql) |
| Criar um aplicativo mobile | [Catálogo, biblioteca e coleções](docs/mobile-apps.md) |
| Integrar feed, publicações, reviews e notificações | [Comunidade](docs/community.md) |
| Consultar tópicos e participar do fórum | [Fórum e Spaces](docs/forum.md) |
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
| API GraphQL pública | `https://branilist.com/api/graphql` |
| Explorador GraphQL | [branilist.com/api/graphql/playground](https://branilist.com/api/graphql/playground) |
| Schema GraphQL | [SDL no repositório](graphql/schema.graphql) · [SDL do servidor](https://branilist.com/api/graphql/schema.graphql) |
| Autorização no navegador | `https://branilist.com/oauth/authorize` |
| Emissão e renovação de tokens | `https://branilist.com/oauth/token` |
| Revogação de token | `https://branilist.com/oauth/revoke` |
| Painel de desenvolvedores | [branilist.com/settings/developer](https://branilist.com/settings/developer) |
| Apresentação da API | [branilist.com/developers](https://branilist.com/developers) |

## O que está documentado

As operações REST em `/api/v1`, o GraphQL público em `/api/graphql`, os endpoints de tokens e o fluxo de consentimento no navegador. A documentação inclui consultas e alterações autorizadas da conta, comunidade, fórum e integrações. APIs de sessão do site, GraphQL interno em `/graphql`, administração e extensão têm contratos separados.

Consulte o [histórico](docs/changelog.md), os [escopos OAuth](docs/authentication.md) e as [limitações atuais](docs/faq.md). Exemplos com mídias, perfis e IDs são ilustrativos; o catálogo e a implantação podem mudar.

## Navegação e contribuição

- [Índice completo](docs/README.md)
- [Como contribuir e validar a documentação](CONTRIBUTING.md)
- [Relatar um problema na documentação](https://github.com/Aniyan-Project/Branilist-docs/issues)

O conteúdo é mantido em Markdown para leitura e revisão diretamente no GitHub. O site usa VitePress e é publicado automaticamente no GitHub Pages. A referência REST é gerada de [`openapi.json`](openapi.json), e a referência GraphQL de [`graphql/schema.graphql`](graphql/schema.graphql). Páginas Markdown entram automaticamente na navegação nos três idiomas. Veja [como publicar e adicionar rotas](docs/publishing.md).
