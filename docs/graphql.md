# API GraphQL pública

[Fórum e Spaces](forum.md)
[Índice](README.md) · [Aplicativos mobile](mobile-apps.md) · [Comunidade, reviews e notificações](community.md) · [OAuth e PKCE](authentication.md) · [Schema SDL](../graphql/schema.graphql) · [Termos de uso da API](terms-of-use.md)

A API GraphQL usa **`POST https://branilist.com/api/graphql`** e um schema próprio para integrações. A REST continua disponível em `/api/v1`. O GraphQL do site em `/graphql` tem outro contrato e autenticação.

O [explorador](https://branilist.com/api/graphql/playground) permite consultar o schema e executar operações. A referência do site é gerada do SDL em cada publicação, incluindo queries, mutations, tipos, argumentos, valores padrão e enums. O servidor também oferece [SDL](https://branilist.com/api/graphql/schema.graphql) e introspecção GraphQL.

## Primeira consulta

```sh
curl --fail-with-body 'https://branilist.com/api/graphql' \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { mediaPage(search: \"Frieren\", first: 5) { nodes { id title { romaji english portuguese } coverImage } pageInfo { hasNextPage } } }"}'
```

Escolha os campos necessários. `mediaPage` aceita texto opcional, `type: ANIME` ou `MANGA`, `first` e `offset`. Sem texto, lista o catálogo por ID interno descendente. A busca considera títulos romaji, inglês, português e nativo, com texto literal de 2–200 caracteres. IDs são serializados como **strings GraphQL ID**, preservando a precisão de 64 bits.

## Autenticação e escopos

| Operação | Credencial |
| --- | --- |
| Fórum e Spaces | OAuth `forum:read / forum:write` |
| Catálogo, detalhes, gêneros, estúdios, profissionais e personagens | Acesso anônimo ou API key; OAuth também pode consultar |
| `media`, catálogo sem busca e entidades relacionadas com API key | `catalog:read` |
| `mediaPage` com texto e API key | `search:read`; os relacionamentos selecionados exigem `catalog:read` |
| `user`, `viewer.profile` | OAuth `profile:read` |
| Bibliotecas e `media.viewerEntry` | OAuth `library:read` |
| Atividade e histórico | OAuth `activity:read` |
| Coleções e seus itens | OAuth `collections:read` |
| Salvar ou remover entrada da biblioteca | OAuth `library:write` |
| Editar perfil | OAuth `profile:write` |
| Ler/salvar preferências | OAuth `preferences:read / preferences:write` |
| Ler/salvar privacidade | OAuth `privacy:read / privacy:write` |
| Ler/alterar favoritos | OAuth `favourites:read / favourites:write` |
| Criar, editar e excluir coleções | OAuth `collections:write` |
| Feed, seguidores, publicações, reviews e comentários | OAuth `social:read` |
| Seguir, publicar e reagir | OAuth `social:write` |
| Escrever reviews | OAuth `reviews:write` |
| Escrever comentários | OAuth `comments:write` |
| Ler/alterar notificações | OAuth `notifications:read / notifications:write` |
| Ler/alterar bloqueios e silenciamentos | OAuth `blocks:read / blocks:write` |
| Enviar denúncias | OAuth `reports:write` |

Envie `Authorization: Bearer ACCESS_TOKEN` ou `X-Branilist-API-Key: API_KEY`. Não envie ambos. API keys são para servidores e não autorizam dados pessoais nem mutations. Cookies do site não autenticam a API pública. Use o [mesmo fluxo OAuth com PKCE](authentication.md), incluindo renovação e revogação. Escopos retirados da aplicação deixam de autorizar os campos correspondentes.

`viewer` exige OAuth válido; cada campo interno verifica seu escopo. É possível ler apenas a biblioteca com `library:read`, sem `profile:read`. `user` exige `profile:read`, além dos escopos dos campos aninhados escolhidos. Falhas em campos anuláveis podem produzir resposta parcial com `data` e `errors`.

## Mídias e relacionamentos

```graphql
query MediaByProvider($malId: ID!) {
  media(malId: $malId) {
    id
    malId
    anilistId
    title { romaji portuguese }
    genres(first: 10) { nodes { id name } }
    relations(first: 5) { nodes { type media { id title { romaji } } } }
    studios(first: 5) { nodes { role studio { id name } } }
    staff(first: 5) { nodes { role staff { id name } } }
    characters(first: 5) { nodes { role character { id name } } }
  }
}
```

Em `media`, informe **exatamente um** argumento: `id`, `malId` ou `anilistId`. IDs externos consultam vínculos existentes e não importam obras automaticamente. Obra ausente, sem vínculo ou oculta pelo filtro adulto retorna `null`.

As raízes `staff(id:)`, `character(id:)`, `studio(id:)` e `genres` oferecem dados do catálogo. `averageScore` usa 0–100; a nota pessoal `score` usa 0.5–10. Descrições e bios são conteúdo do usuário/catálogo: sanitize antes de renderizar HTML.

## Outros usuários e conta autenticada

```graphql
query PublicUser($username: String!) {
  user(username: $username) {
    id
    username
    library(first: 5) { nodes { mediaId status progress media { title { romaji } } } }
    collections(first: 5) { nodes { id name items(first: 5) { nodes { id } } } }
  }
}
```

`user` recebe exatamente um de `id` ou `username`. `username: "123456"` é inequívoco; não existe seleção automática entre ID e nome no GraphQL.

Todas as consultas de outra pessoa exigem conta ativa, perfil PUBLIC e ausência de bloqueios em qualquer direção. Biblioteca e coleções exigem listas PUBLIC; atividade exige também atividade PUBLIC. As exceções de proprietário, seguidor e administrador não liberam essas consultas públicas. Entradas privadas e coleções PRIVATE/UNLISTED não aparecem.

`user.activity` contém apenas eventos MEDIA_LIST publicados no feed e associados a uma entrada atual não privada. `viewer.activity` é o histórico pessoal de auditoria, incluindo eventos de remoção. São modelos diferentes.

```graphql
query MyAccount {
  viewer {
    id
    scopes
    profile { username displayName }
    library(first: 10, status: CURRENT, type: ANIME) {
      nodes { mediaId progress score private }
      pageInfo { limit offset hasNextPage }
    }
    activity(first: 5) { nodes { eventType mediaId progressDelta } }
    collections(first: 5) { nodes { id name visibility } }
  }
}
```

`viewer` sempre representa o dono do token e inclui suas entradas e coleções privadas, conforme os escopos. Email, credenciais, permissões administrativas e operações de gestão do site não fazem parte deste schema.

## Criar ou atualizar a biblioteca

```graphql
mutation SaveProgress($mediaId: ID!, $input: LibraryEntryInput!) {
  saveLibraryEntry(mediaId: $mediaId, input: $input) {
    mediaId
    status
    progress
    score
    repeatCount
    private
    startedAt
  }
}
```

```json
{"mediaId":"123","input":{"status":"CURRENT","progress":4,"score":8.5}}
```

A mutation exige `library:write` e altera somente a entrada do dono do token. O ID é o **ID interno da mídia**, obtido também pelas buscas MAL/AniList.

**Campos omitidos são preservados na atualização**, inclusive entre chamadas concorrentes. Ao criar, os padrões são `PLANNING`, progresso/repetições 0, nota/datas nulas e `private: false`. Enviar explicitamente `CURRENT`/`COMPLETED` pode preencher datas ausentes automaticamente.

- `progress` e `repeatCount`: inteiros não negativos.
- `score`: `null` ou 0.5–10 em passos de 0.5. `null` apaga a nota.
- `startedAt` e `completedAt`: prefira `YYYY-MM-DD`; RFC3339 também é aceito. `null` ou `""` limpa a data.
- `status`, `progress`, `repeatCount` e `private` não aceitam `null` explícito; omita para preservar.

Isso difere do PUT da REST, que continua aplicando seus valores padrão aos campos omitidos. Escrita e histórico usam o mesmo serviço de biblioteca. Não há verificação de versão: duas alterações no mesmo campo ainda podem sobrescrever uma à outra.

## Remover da biblioteca

```graphql
mutation RemoveEntry($mediaId: ID!) {
  removeLibraryEntry(mediaId: $mediaId) { mediaId removed }
}
```

Exige `library:write`. Retorna `removed: true` quando remove e `false` quando a entrada já não existe. A exclusão e o histórico REMOVED são gravados na mesma transação. Repetir não duplica o histórico. O catálogo, favoritos e coleções não são excluídos.

## Paginação, conteúdo adulto e limites

As listas usam `nodes` e `pageInfo { limit offset hasNextPage }`. `first` aceita 1–100 (padrão 20); `offset`, 0–10000 (padrão 0). Aumente offset pelo first; alterações concorrentes podem deslocar páginas. Filtros de privacidade e conteúdo são aplicados antes da paginação.

Conteúdo adulto fica oculto no acesso anônimo e com API key. Com OAuth, depende de a plataforma permitir e de o dono do token não optar por ocultá-lo. O carregamento em lote e seu cache duram apenas uma requisição. Não reutilize respostas autenticadas entre contas.

| Controle | Limite |
| --- | --- |
| Corpo HTTP | 64 KiB |
| Parser | 4000 tokens |
| Campos de raiz, incluindo aliases e fragments | 20 |
| Campos expandidos | 2000 |
| Profundidade de dados | 12; introspecção do schema permite 20 |
| Complexidade | 1500; páginas multiplicam o custo pelo `first` |
| Prazo de execução | 10 segundos, com cancelamento de consultas ao banco |
| IP | 120 requisições por minuto |
| Token OAuth | 300 por minuto, compartilhado com o limitador REST |

Aplicações autenticadas também usam a quota diária e o limite por minuto da integração. Cada POST autenticado admitido consome uma requisição, mesmo que a operação seja recusada na validação ou retorne erros. A quota diária é compartilhada com a REST. Cabeçalhos `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` e `Retry-After` ficam acessíveis via CORS. Respostas da API usam `Cache-Control: private, no-store`.

Use páginas pequenas em consultas com vários relacionamentos. Limites de complexidade podem recusar uma consulta antes de qualquer leitura. Sem batches HTTP, uploads, subscriptions ou autorização por cookie. Manutenção bloqueia leituras e/ou mutations conforme a configuração da plataforma.

## Erros e formato HTTP

Envie JSON com `query`, `variables` e, quando necessário, `operationName`. Só POST executa operações. Verifique sempre `errors`, mesmo com HTTP 200. Erros incluem `extensions.code`, por exemplo `UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`, `NOT_FOUND`, `QUERY_LIMIT_EXCEEDED`, `COMPLEXITY_LIMIT_EXCEEDED`, `RATE_LIMITED`, `QUOTA_EXCEEDED`, `SERVICE_UNAVAILABLE` ou `TIMEOUT`. Falhas internas não expõem SQL ou credenciais.

Falhas de autenticação HTTP retornam 401; limite/quota, 429; manutenção/integração indisponível, 503; método inválido, 405; corpo com tamanho declarado acima do máximo, 413. JSON, sintaxe e validação podem retornar 4xx. Uma operação com vários campos de mutation executa-os em sequência, mas cada mutation tem sua própria transação; não existe transação única para a operação inteira.

## Manter a referência

O [cliente Node.js](../examples/graphql.mjs) é executável com `node examples/graphql.mjs` e faz apenas consultas por padrão. Ele detecta erros GraphQL mesmo com HTTP 200, preserva dados parciais no erro e não repete operações automaticamente.

O SDL em `graphql/schema.graphql` é a fonte da referência GraphQL no repositório de docs. Ao mudar o contrato do backend, atualize essa cópia a partir de `apps/api/internal/publicgraph/schema.graphqls`. O build regenera tipos, argumentos e navegação nos três idiomas e fornece SDL e introspecção JSON para download. Os exemplos GraphQL são validados contra esse schema durante `npm run check`.
