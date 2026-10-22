# Fórum e Spaces

[Índice](README.md) · [GraphQL](graphql.md) · [Comunidade e notificações](community.md)

O fórum usa `POST https://branilist.com/api/graphql`, com OAuth Bearer. Solicite `forum:read` para consultar e `forum:write` para publicar e interagir. Leitura e escrita são independentes: configure os escopos na aplicação e obtenha consentimento do usuário. API keys e acesso anônimo não autorizam estas operações.

## Consultar tópicos

```graphql
query BrowseForum($category: String) {
  forumTopics(filter: {categorySlug: $category}, sort: ACTIVITY, first: 10) {
    nodes {
      id title status pinned featured
      author { id username displayName }
      category { slug name locked }
      tags { id slug name }
      spaceSlug postCount viewerSubscribed
    }
    pageInfo { hasNextPage limit offset }
  }
}
```

`forumTopics` aceita texto de até 200 caracteres, `categorySlug`, `tagSlug`, `spaceSlug` e status `OPEN` ou `LOCKED`. Os filtros são combinados. Ordenações: `ACTIVITY`, `RELEVANCE`, `POPULARITY` e `NEWEST`. A busca considera título, tags e mensagens acessíveis; conteúdo oculto não produz correspondências. `%` e `_` seguem os curingas da busca do fórum. A consulta não aumenta o contador de visualizações.

`forumTopic(id:)` lê um tópico; `forumPost(id:)` lê uma mensagem. `forumTopic.posts(first:, offset:)` lista as mensagens em ordem de criação, incluindo a inicial. Mensagens removidas têm `removed: true` e corpo vazio. `parentId` identifica a mensagem respondida no mesmo tópico e é ocultado se ela estiver inacessível. Revisões e motivos históricos de edição não são expostos.

## Categorias, tags e Spaces

`forumCategories` e `forumTags` são paginados. A categoria informa se está fechada para novos tópicos. Cada tópico retorna até oito tags.

`forumSpaces(first:, offset:)` lista Spaces ativas; `forumSpace(slug:)` oferece descrição, regras, imagens, responsável, contagens e `viewerMember`. Contagens de membros, tópicos e mensagens consideram a visibilidade atual. Responsáveis e moderadores não recebem exceções de acesso nesta API. Gerenciar Spaces, atribuir papéis e moderar conteúdo continuam fora do contrato público.

## Criar, responder e editar

```graphql
mutation NewTopic($category: ID!, $tags: [ID!]!) {
  createForumTopic(input: {
    categoryId: $category
    title: "O que vocês estão assistindo?"
    body: "Compartilhe suas recomendações da temporada."
    tagIds: $tags
  }) { id title }
}
```

`createForumTopic` exige título de 4–160 caracteres e corpo de 2–20000, após remover espaços nas pontas. Aceita até oito IDs de tags existentes e distintos. Tópico, mensagem inicial, tags, inscrição do autor e notificações são gravados juntos; tags inválidas não deixam um tópico parcial. A criação pública não move tópicos para Spaces.

```graphql
mutation Reply($topic: ID!, $parent: ID) {
  createForumPost(topicId: $topic, parentId: $parent, body: "Minha recomendação!") {
    id topicId parentId body viewerOwns
  }
}
```

`createForumPost` aceita corpo de 2–20000 caracteres e inscreve o autor no tópico. `parentId` opcional deve apontar para uma mensagem ativa e acessível do mesmo tópico.

`updateForumPost(id:, body:, reason:)` altera somente uma mensagem ativa do dono do token. O motivo opcional aceita até 300 caracteres; o serviço registra a revisão sem expor o histórico na API pública. Tópicos fechados e participantes silenciados não podem publicar, editar ou reagir.

`deleteForumPost(id:)` remove somente uma mensagem do dono do token e devolve `false` se nada foi removido, inclusive em uma repetição. A exclusão preserva a estrutura da discussão com corpo vazio. `setForumTopicTags(id:, tagIds:)` substitui as tags somente de um tópico do dono; lista vazia limpa as tags.

## Reações, inscrições e participação

```graphql
mutation Interact($topic: ID!, $post: ID!, $space: ID!) {
  setForumSubscription(id: $topic, enabled: true)
  setForumReaction(id: $post, reaction: HELPFUL, enabled: true)
  setForumMembership(spaceId: $space, enabled: true)
}
```

As operações `set*` recebem o estado desejado: repetir `enabled: true` mantém a relação. Cada campo tem sua própria transação; o exemplo não é uma transação única. Reações: `LIKE`, `HELPFUL`, `AGREE` e `INSIGHTFUL`. Não é permitido reagir à própria mensagem. `reactions` mostra contagem e `viewerReacted` por tipo.

`viewer.forumSubscriptions(first:, offset:)` exige `forum:read` e lista somente tópicos inscritos ainda acessíveis. Inscrição não concede acesso a conteúdo privado ou arquivado.

Participação em Spaces usa o papel comum `MEMBER`. A API não remove responsáveis/moderadores nem permite sair durante um silenciamento ativo para contornar a restrição. Sair e voltar não restaura permissões de moderação.

## Notificações e denúncias

`viewer.notifications` continua exigindo `notifications:read`. As referências `forumTopicId`, `forumPostId` e a prévia de fórum exigem também `forum:read`, fórum habilitado e conteúdo atualmente acessível. Remoção, arquivamento, bloqueio ou perda de visibilidade podem tornar esses campos nulos. Não há subscriptions GraphQL ou entrega push neste contrato.

`reportContent` aceita também `FORUM_TOPIC` e `FORUM_POST`, com `reports:write`, aplicando a mesma visibilidade. Não exige `forum:write` e não permite denunciar conteúdo próprio. Retorna somente o comprovante, sem dados de moderação. Veja [limites das denúncias](community.md).

## Privacidade, limites e recuperação

Tópicos arquivados, Spaces arquivadas, contas inativas/excluídas e bloqueios em qualquer direção são excluídos. Perfis `FOLLOWERS` exigem seguir o autor; perfis `PRIVATE` são acessíveis somente ao próprio dono. Essas regras se aplicam antes da paginação e às mensagens pesquisadas. Mensagens de um autor inacessível não aparecem na discussão; referências ao pai também são revalidadas. Um token de administrador continua limitado às permissões do contrato público.

Paginação: `first` de 1–100, `offset` de 0–10000, padrão 20/0. Valem os [limites de custo e erros GraphQL](graphql.md). Por conta: até 10 novos tópicos/hora, 60 respostas/hora, 60 edições/hora, 60 exclusões/hora, 60 substituições de tags/hora e 120 interações/hora. Email verificado pode ser exigido; desabilitar o fórum bloqueia esta superfície.

Consulte `errors` mesmo com HTTP 200. Após timeout ao criar tópico ou resposta, confirme o estado antes de reenviar: essas criações não têm chave de idempotência. Para renderizar BBCode, use um renderizador que sanitize o conteúdo e links. Não trate o corpo como HTML confiável.
