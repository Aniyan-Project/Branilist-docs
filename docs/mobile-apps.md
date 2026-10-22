# Aplicativos mobile

[Índice](README.md) · [GraphQL](graphql.md) · [OAuth e PKCE](authentication.md)

A API pública permite criar aplicativos de catálogo e acompanhamento da biblioteca. Todas as operações abaixo usam `POST https://branilist.com/api/graphql`. O login usa OAuth; cookies do site não autorizam as consultas públicas.

## Autorização no celular

1. Cadastre uma aplicação **PUBLIC** e um callback HTTPS sob seu controle. Configure Android App Links ou iOS Universal Links para esse endereço.
2. No painel da aplicação, habilite somente os escopos que o aplicativo utiliza. Escopos novos não são adicionados automaticamente às aplicações ou aos tokens existentes.
3. Gere `state`, `code_verifier` e `code_challenge` S256 novos para cada tentativa.
4. Abra a autorização no navegador do sistema e confira `state` no retorno. Troque o código por tokens em `/oauth/token`, enviando o mesmo callback e o verifier. Não inclua client secret em um app PUBLIC.
5. Armazene os tokens no armazenamento seguro da plataforma. Renove o acesso com o refresh token e substitua-o pelo novo token recebido. A renovação rotaciona o refresh token; não execute renovações concorrentes.
6. Ao sair, revogue o token em `/oauth/revoke` e apague os dados locais daquela conta.

O callback deve coincidir exatamente com o endereço cadastrado. URIs com esquema próprio, como `meuapp://callback`, não são aceitas atualmente. O aplicativo não precisa receber a senha do usuário. Consulte o [fluxo OAuth](authentication.md) para parâmetros e exemplos.

## Exploração do catálogo

`mediaPage` aceita os argumentos existentes `search`, `type`, `first` e `offset`, além de `filter` e `sort`. Os filtros são combinados: gênero por slug, intervalo de anos, temporada, formato e status. Os anos vão de 1900 a 2200; `yearFrom` não pode superar `yearTo`. A ordenação padrão continua `ID_DESC`.

```graphql
query Explore {
  mediaPage(type: ANIME, filter: {yearFrom: 2020, genre: "action", status: FINISHED}, sort: SCORE_DESC, first: 12) {
    nodes { id title { romaji portuguese } coverImage averageScore }
    pageInfo { hasNextPage offset limit }
  }
  trendingMedia(type: ANIME, days: 30, first: 6) { id title { romaji } }
}
```

`mediaBySlug(slug:, type:)` resolve links de obras. `trendingMedia` aceita `days` de 1 a 90 e `first` de 1 a 30. `media.similar(first:)` oferece obras semelhantes; `viewer.recommendations(first:)` usa a biblioteca do dono do token e exige `library:read`. Recomendações aceitam de 1 a 30 resultados e podem devolver menos itens após o filtro de conteúdo adulto.

## Biblioteca e estatísticas

```graphql
query MyLibrary {
  viewer {
    libraryPage(search: "Frieren", type: ANIME, sort: UPDATED, first: 20) {
      nodes { mediaId status progress score private media { title { romaji } } }
      pageInfo { hasNextPage }
    }
    libraryInsights {
      mediaCount animeCount mangaCount completedCount
      episodesConsumed chaptersConsumed estimatedWatchMinutes averageScore
      statuses { key label count percentage }
    }
  }
}
```

As duas consultas exigem `library:read`. `libraryPage` filtra por texto, status e tipo; ordena por atualização, título, nota, progresso, início ou conclusão. A pesquisa aceita até 200 caracteres e trata `%` e `_` como texto literal. As estatísticas representam a biblioteca pessoal completa e incluem distribuições de gêneros, formatos, anos, status, notas, países e estúdios. A escala de nota das estatísticas segue o serviço do site; a nota individual de `LibraryEntry.score` continua de 0,5 a 10.

Para alterar progresso, nota e status, use [saveLibraryEntry](graphql.md). A atualização parcial dessa mutation preserva os campos omitidos.

## Favoritos

`viewer.favourites(type:, first:, offset:)` exige `favourites:read`. Os tipos são `MEDIA`, `STAFF`, `STUDIO` e `CHARACTER`; cada item oferece ID, posição e o objeto correspondente.

```graphql
mutation Favourite($id: ID!) {
  setFavourite(type: MEDIA, id: $id, enabled: true) { type id enabled }
}
```

`setFavourite` exige `favourites:write`. Enviar o mesmo estado novamente mantém o resultado: `enabled: true` adiciona e `false` remove. `reorderFavourites(type:, ids:)` coloca de 1 a 200 IDs distintos no início da lista; os demais preservam sua ordem relativa. Todos os IDs devem pertencer aos favoritos do dono do token.

## Coleções

`collection(id:)`, `publicCollections(search:, type:, first:, offset:)` e os itens das coleções exigem `collections:read`. A pesquisa pública mostra somente coleções PUBLIC de contas ativas com perfil e listas públicos, sem bloqueios em nenhuma direção. O dono pode consultar suas coleções privadas pelo ID ou por `viewer.collections`.

```graphql
mutation CreateCollection {
  createCollection(input: {mediaType: ANIME, name: "Para o fim de semana", visibility: PRIVATE, tags: ["curtos"]}) {
    id name visibility
  }
}
```

`createCollection`, `updateCollection`, `deleteCollection` e `setCollectionItem` exigem `collections:write` e afetam somente o dono do token. Os limites de coleções por tipo são os mesmos do site, incluindo benefícios VIP.

`updateCollection` **substitui os metadados**: envie nome, descrição, cor, visibilidade, tags, capa e posição desejados. Os campos opcionais omitidos usam seus valores padrão ou são apagados; os itens não mudam. A capa e os itens devem corresponder ao tipo da coleção. O nome aceita 1–60 caracteres, a descrição até 500 e as tags até 8 valores de 24 caracteres cada.

`setCollectionItem(collectionId:, mediaId:, enabled:, position:, note:)` adiciona, atualiza ou remove um item. Posição e nota substituem os valores anteriores; a nota aceita até 500 caracteres e permanece privada na API pública. `deleteCollection` retorna `false` quando não remove nenhuma coleção pertencente ao dono do token.

## Perfil, preferências e privacidade

| Recurso | Leitura | Escrita |
| --- | --- | --- |
| Perfil | `viewer.profile` com `profile:read` | `updateProfile` com `profile:write` |
| Preferências | `viewer.preferences` com `preferences:read` | `savePreferences` com `preferences:write` |
| Privacidade | `viewer.privacy` com `privacy:read` | `savePrivacy` com `privacy:write` |

`updateProfile` substitui nome de exibição, biografia, avatar e banner. Biografia e URLs omitidas são apagadas; posições do banner omitidas são preservadas. Nome aceita 1–60 caracteres, biografia até 10000 e posições de 0 a 100. Imagens devem ser uploads pertencentes ao dono do token; a GraphQL pública não faz upload de arquivos. O limite compartilhado de edição do perfil é 20 operações por hora por usuário.

`savePreferences` recebe idioma, preferência de título, tema e ocultação de conteúdo adulto; `darkTheme` omitido preserva a variante atual e `null` é inválido. Os idiomas precisam estar habilitados no Branilist. Tornar o conteúdo adulto visível passa a valer na próxima requisição; ocultá-lo passa a valer imediatamente.

`savePrivacy` recebe as visibilidades de perfil, listas e atividade (`PUBLIC`, `FOLLOWERS` ou `PRIVATE`). Tokens com leitura não recebem permissão de escrita implicitamente. Leia os campos devolvidos pela mutation para confirmar o estado persistido.

## Limites do contrato

As regras de [privacidade, paginação, custo e erros GraphQL](graphql.md) continuam valendo. Uma operação com várias mutations executa cada campo em sua própria transação. Para uso offline, confira o estado após falhas de rede e não repita operações indiscriminadamente. Esta API não oferece um protocolo de sincronização incremental ou resolução automática de conflitos.

Feed, seguidores, publicações, reviews, comentários e notificações estão no [guia de comunidade](community.md). Fórum, push e gestão sensível de conta não fazem parte destas operações. Mantenha as credenciais isoladas por conta e trate erros mesmo quando a resposta HTTP for 200.
