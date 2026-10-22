# Comunidade, reviews e notificações

[Índice](README.md) · [Guia GraphQL](graphql.md) · [Aplicativos mobile](mobile-apps.md) · [OAuth e PKCE](authentication.md)

As operações sociais usam `POST https://branilist.com/api/graphql` com OAuth Bearer. API keys e cookies do site não autorizam esses recursos. O dono do token é sempre o autor das ações: não há argumento para executar uma mutation em nome de outra pessoa.

## Permissões

| Escopo | Acesso |
| --- | --- |
| `social:read` | Feed, seguidores, publicações, reviews e comentários acessíveis; inclui mensagens privadas quando o dono do token for participante autorizado |
| `social:write` | Seguir, publicar, editar/excluir publicações próprias, reagir e remover eventos próprios do feed |
| `reviews:write` | Criar, substituir e excluir a própria review de uma obra |
| `comments:write` | Publicar, responder e excluir comentários próprios |
| `notifications:read` | Notificações pessoais, contador e preferências |
| `notifications:write` | Marcar notificações como lidas e alterar preferências |
| `blocks:read` | Consultar bloqueios e silenciamentos pessoais |
| `blocks:write` | Bloquear/desbloquear e silenciar/reativar contas |
| `reports:write` | Enviar denúncias de conteúdo acessível |

Habilite os escopos necessários no painel da aplicação e solicite novo consentimento. Aplicações e tokens existentes não recebem permissões novas automaticamente. Uma autorização de leitura não inclui escrita; API keys continuam restritas ao catálogo.

## Feed e conexões

```graphql
query CommunityHome {
  viewer {
    feed(scope: FOLLOWING, types: [PROFILE_POST, REVIEW, MEDIA_LIST], first: 20) {
      nodes {
        id type actor { id username displayName avatarUrl }
        post { id body visibility }
        review { id title recommendation spoilerLevel }
        media { id title { romaji } }
        status progress likeCount viewerLiked createdAt
      }
      pageInfo { hasNextPage offset limit }
    }
    followers(first: 20) { nodes { id username } pageInfo { hasNextPage } }
    following(first: 20) { nodes { id username } pageInfo { hasNextPage } }
  }
}
```

`viewer.feed` exige `social:read`; `FOLLOWING` é o padrão e inclui a própria conta. `GLOBAL` considera a comunidade acessível. Os tipos disponíveis são `MEDIA_LIST`, `REVIEW`, `FOLLOW`, `PROFILE_POST` e `REPOST`; uma lista vazia inclui todos. A ordem é da atividade mais recente para a mais antiga, com ID como desempate.

O feed aplica visibilidade de perfil/atividade/listas, conta ativa, bloqueios, silenciamentos e preferência de conteúdo adulto antes de paginar. Atualizações de entradas atualmente privadas não aparecem para terceiros. Mensagens privadas e mensagens direcionadas a um perfil não entram no feed global nem no de pessoas seguidas.

`user(id: ou username:)` também oferece `followers`, `following`, `posts` e `reviews`; exige `profile:read` no objeto principal e `social:read` nesses campos. Esse grupo preserva as restrições de perfil público; `user.posts` expõe somente publicações públicas e exige atividade pública. Use o feed, `viewer.posts` e detalhes por ID para recursos pessoais ou visíveis a seguidores. Perfis resumidos `SocialActor` não contêm email, credenciais ou permissões administrativas.

```graphql
mutation Follow($username: String!) {
  setFollow(username: $username, enabled: true)
}
```

As mutations `setFollow`, `setBlock` e `setMute` recebem username e estado desejado. Repetir o mesmo estado o preserva. O booleano retornado representa o estado final: `false` em `setFollow(..., enabled: false)` significa que a pessoa deixou de ser seguida.

## Publicações, respostas e citações

```graphql
mutation Publish {
  createPost(input: {body: "Minha publicação no Branilist"}) {
    id body visibility createdAt
  }
}
```

- `createPost(input:)`: corpo de 1–12000 caracteres; até 4 IDs de imagens já enviadas pela própria conta, do tipo POST_IMAGE.
- `updatePost(id:, body:)`: substitui somente o texto de uma publicação própria; preserva imagens e contexto.
- `deletePost(id:)`: exclui uma publicação própria e suas respostas conforme as regras do site.
- `post(id:)`: detalhes de uma publicação acessível, incluindo `replies(first:, offset:)` e `quotedPost`.
- `viewer.posts`: publicações próprias e mensagens direcionadas ao dono do token, respeitando os bloqueios atuais.

Para responder, envie `parentId` apontando para a publicação principal. Há um nível de respostas; a conversa herda a visibilidade da publicação principal. Para citar, envie `quotedPostId`; apenas publicações principais públicas e não direcionadas podem ser citadas. Respostas e citações são alternativas mutuamente exclusivas.

Para uma mensagem de perfil, envie `recipientId` de outra conta e `visibility: PRIVATE` ou `PUBLIC`. Mensagens privadas são acessíveis somente ao autor e destinatário autorizados; respostas herdam essa proteção. Ser administrador no site não concede exceção na API pública. Uma mensagem direcionada não pode ser também resposta ou citação. Publicações comuns sem destinatário usam PUBLIC.

O corpo é texto/BBCode, não HTML pronto para injetar numa página. Renderize e sanitize conteúdo no cliente. Upload de arquivos não faz parte desse endpoint; IDs de imagens devem existir e pertencer à conta autorizada.

## Reviews

```graphql
mutation Review($mediaId: ID!) {
  saveReview(input: {
    mediaId: $mediaId
    title: "Minha opinião"
    body: "Uma review com detalhes suficientes sobre esta obra."
    recommendation: RECOMMENDED
    spoilerLevel: NONE
    aspects: {story: 8, enjoyment: 9}
  }) { id title body recommendation aspects { story enjoyment } }
}
```

`saveReview` exige `reviews:write` e cria ou substitui a review do dono do token para a obra. Use o ID interno do Branilist. O corpo aceita 20–10000 caracteres; o título opcional, até 120. Recomendações: `RECOMMENDED`, `MIXED` ou `NOT_RECOMMENDED`. Spoilers: `NONE`, `MINOR` ou `MAJOR`. Os aspectos opcionais story, characters, visuals, sound e enjoyment usam inteiros de 1 a 10.

A entrada é uma substituição: título e aspectos opcionais omitidos são apagados. Repetições concorrentes de criação não geram eventos duplicados de review no feed. A review não altera a nota ou o progresso da biblioteca.

Consulte `review(id:)`, `reviews(mediaId:, first:, offset:)`, `user.reviews` ou `viewer.myReview(mediaId:)` com `social:read`. `deleteReview(id:)` remove somente a própria review e exige `reviews:write`.

## Comentários e reações

`comments(mediaId: ou reviewId: ou activityId:)` exige exatamente um seletor de discussão e `social:read`. `createComment` exige `comments:write`, o mesmo seletor e um corpo de 1–4000 caracteres. Para responder, envie também `parentId` de um comentário acessível da mesma discussão; respostas a respostas são associadas ao comentário raiz. `deleteComment` remove somente comentários próprios. Comentários removidos podem aparecer como registros vazios com `removed: true`, preservando a conversa.

```graphql
mutation Comment($reviewId: ID!) {
  createComment(input: {reviewId: $reviewId, body: "Meu comentário sobre a review"}) {
    id body parentId createdAt
  }
}
```

`setPostLike`, `setPostRepost`, `setActivityLike`, `setReviewLike` e `setCommentLike` exigem `social:write`, ID do recurso e `enabled`. `setReviewReaction` acrescenta `reaction: HELPFUL`, `INSIGHTFUL` ou `WELL_WRITTEN`. São atribuições de estado, não inversões automáticas. Aplicam-se as restrições do site, incluindo bloqueios e proibição de curtir/republicar a própria publicação. Mensagens privadas não podem ser republicadas.

`deleteActivity(id:)` remove somente um evento do feed pertencente ao dono do token; não apaga a biblioteca, a review ou a publicação original e não desfaz automaticamente uma reação.

## Notificações pessoais

```graphql
query Notifications {
  viewer {
    unreadNotificationCount
    notifications(first: 20) {
      nodes { id type preview priority readAt createdAt postId reviewId commentId }
      pageInfo { hasNextPage }
    }
    notificationPreferences { follows replies emailMode quietHoursEnabled quietTimezone }
    notificationTypePreferences { type inAppEnabled emailEnabled mutedUntil }
  }
}
```

Esses campos exigem `notifications:read`. Referências e prévias são revalidadas segundo o acesso atual; podem vir `null` quando o conteúdo foi removido, ficou privado ou não pode ter sua autorização confirmada. A API não reutiliza uma prévia antiga para contornar privacidade. O contador pode incluir notificações cuja prévia não é exibida.

`markNotificationRead(id:)` e `markAllNotificationsRead` exigem `notifications:write`. A primeira retorna `true` quando o ID pertence à conta, inclusive se já estava lido; IDs de outras contas retornam `false`. A segunda retorna a quantidade de itens que estavam não lidos e foram marcados.

`saveNotificationPreferences` substitui as preferências gerais: categorias habilitadas, email `OFF`/`IMMEDIATE`/`DAILY`, agrupamento, destaque de importantes, indicador e horário silencioso. Os horários usam minutos de 0 a 1439 e fuso IANA, por exemplo `America/Sao_Paulo`. Todos os campos dessa entrada são obrigatórios.

`saveNotificationTypePreference` substitui a configuração de um tipo conhecido. Consulte os nomes em `viewer.notificationTypePreferences`; informe inAppEnabled, emailEnabled e mutedUntil opcional. Omitir ou enviar `null` em mutedUntil limpa o silenciamento temporário; datas passadas são normalizadas pelo servidor. Essas operações alteram preferências da conta, não enviam notificações arbitrárias.

## Bloqueios e denúncias

`viewer.blockedUsers` e `viewer.mutedUsers` são paginados e exigem `blocks:read`. `setBlock` e `setMute` exigem `blocks:write`. Bloquear remove relações de seguir, silenciamentos e notificações entre as duas contas conforme o site. Desbloquear não restaura essas relações. Silenciar afeta o feed; não é uma proibição de consultar conteúdo público diretamente.

```graphql
mutation Report($postId: ID!) {
  reportContent(input: {targetType: PROFILE_POST, targetId: $postId, reason: "SPAM"}) {
    id status createdAt
  }
}
```

`reportContent` exige `reports:write` e aceita USER, REVIEW, COMMENT ou PROFILE_POST. O recurso precisa estar acessível; não é permitido denunciar o próprio conteúdo. Motivo: 3–120 caracteres; detalhes opcionais: até 2000. Categorias conhecidas, como SPAM, são normalizadas pelo servidor. Uma denúncia aberta duplicada é rejeitada. O resultado é somente um comprovante de criação, sem prévias administrativas, dados de outros denunciantes ou notas de moderação.

## Limites e recuperação

Valem os [limites globais GraphQL](graphql.md), paginação 1–100 e offset até 10000. Há limites adicionais por conta: publicações/edições 20 a cada 10 minutos, reviews 10 a cada 10 minutos, comentários 30 a cada 5 minutos e denúncias 10 por hora, com teto de 20 em 24 horas. Interações, preferências e exclusões também têm limites próprios. A plataforma pode exigir email verificado para publicar/interagir ou desabilitar denúncias.

Inspecione `errors` mesmo com HTTP 200. Alterações de outra conta ou conteúdo indisponível não recebem exceção administrativa. Criação de publicações, comentários e denúncias não deve ser repetida automaticamente após timeout: confirme o estado antes de reenviar. Atribuições `set*` preservam o estado solicitado, mas múltiplos campos de uma mutation não formam uma única transação. A leitura de notificações usa consultas paginadas; este contrato não fornece subscriptions ou push mobile.
