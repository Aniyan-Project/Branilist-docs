# Dados públicos de outros usuários

[Índice](../README.md) · [Conta do dono do token](account.md) · [OAuth](../authentication.md)

Estas rotas consultam outro usuário sem exigir o token dele. Use um access token OAuth válido da sua integração com o escopo indicado. API keys e sessões do site não substituem o Bearer. As rotas retornam somente dados **PUBLIC**, inclusive quando o alvo é o próprio dono do token. Para seus dados autorizados, continue usando `/me`.

## Rotas e autenticação

| Recurso | Caminho | Escopo |
| --- | --- | --- |
| Perfil | `/api/v1/users/{identifier}` | `profile:read` |
| Biblioteca | `/api/v1/users/{identifier}/library` | `library:read` |
| Atividade | `/api/v1/users/{identifier}/activity` | `activity:read` |
| Coleções | `/api/v1/users/{identifier}/collections` | `collections:read` |

Todas usam **GET**. `identifier` aceita o ID interno positivo de 64 bits do **usuário** ou seu username (3–24 letras ASCII, números ou `_`, sem distinção de maiúsculas). O parâmetro opcional `by` aceita `auto` (padrão), `id` ou `username`. Valores vazios, repetidos ou desconhecidos retornam 400.

No modo automático, a API consulta as duas possibilidades. Se ambas apontarem para a mesma conta, retorna essa conta; se apenas uma corresponder, retorna a encontrada. Se apontarem para **contas públicas diferentes**, retorna **409** com `error: "ambiguous_user"`. Use `/api/v1/users/123456?by=username` para buscar o nome numérico ou `/api/v1/users/123456?by=id` para buscar o ID. Usernames numéricos continuam válidos, inclusive quando o número ultrapassa o intervalo de IDs. Um candidato privado, bloqueado ou indisponível mantém o **404**, sem fazer fallback silencioso para outra conta. Com `by=id` ou `by=username`, apenas a opção solicitada é consultada.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/users/example' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

O perfil retorna `id`, `username`, `displayName`, `avatarUrl`, `bannerUrl`, `bio` e `createdAt`, sem email, scopes do alvo ou informações administrativas. Imagens e bio podem ser `null`. Trate a bio como conteúdo do usuário e sanitize antes de renderizar HTML.

## Privacidade

- O perfil precisa estar `PUBLIC`, e a conta deve estar ativa e não excluída.
- Biblioteca e coleções exigem também `list_visibility = PUBLIC`.
- Atividade exige perfil, listas e `activity_visibility` públicos.
- Bloqueios em qualquer direção entre o dono do token e o alvo impedem todas as consultas.
- Configurações `PRIVATE` e `FOLLOWERS` não são liberadas por estas rotas, mesmo para seguidores, o proprietário ou administradores.
- Todas as respostas incluem `Cache-Control: private, no-store`; mudanças de privacidade são verificadas a cada chamada.

Usuário ausente, indisponível, bloqueado ou sem a visibilidade exigida produz o mesmo **404**.

## Biblioteca pública

Usa os campos de [LibraryEntry](models.md), mas exclui entradas privadas antes da paginação. `private` é sempre `false`. A ordenação é `updatedAt` descendente e, nos empates, `mediaId` descendente. A escala de `score` continua sendo 0.5–10.

## Atividade publicada

Retorna somente eventos **MEDIA_LIST** publicados no feed e associados a uma entrada atual não privada. Não é o histórico de auditoria de `/me/activity`: não inclui remoções, estados anteriores, pontuações históricas, reviews, follows ou posts.

Cada item tem `id`, `type`, `mediaId`, `status`, `progress`, `createdAt` e `media`. Aqui, `media` contém `id`, `slug`, `type`, `title` como string e `coverImage`. Ordena por `createdAt` e `id` descendentes. Eventos removidos do feed ou sem entrada atual pública não aparecem. A ausência de um evento não prova ausência de leitura/consumo.

Biblioteca e atividade respeitam a configuração global de conteúdo adulto e a preferência de ocultá-lo do **dono do token**. Se o controle global não estiver disponível, conteúdo adulto fica oculto.

## Coleções públicas

Retorna o modelo [Collection](models.md), incluindo apenas `visibility = PUBLIC`. `PRIVATE` e `UNLISTED` são omitidas, inclusive para o proprietário. Ordena por `position` crescente, depois `createdAt` e `id` decrescentes. `itemCount` é a contagem; não inclui os itens da coleção.

## Paginação

Biblioteca, atividade e coleções aceitam `limit` de **1 a 100** (padrão **20**) e `offset` de **0 a 10000** (padrão **0**). Parâmetros vazios, repetidos, não inteiros ou fora do intervalo retornam 400.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/users/42/library?limit=20&offset=0' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"items":[],"limit":20,"offset":0,"hasMore":false}
```

`hasMore` indica resultados adicionais depois da página. Aumente `offset` pelo `limit` enquanto estiver no intervalo permitido. Alterações concorrentes podem deslocar os resultados; a paginação não é um snapshot nem uma exportação completa garantida. Páginas sem resultados retornam 200 com `items: []`.

## Erros e limites

| Status | Significado |
| --- | --- |
| 400 | ID, username ou paginação inválidos |
| 401 | Bearer ausente/inválido/expirado/revogado, escopo insuficiente ou dono do token inativo |
| 404 | Alvo inexistente, inativo, excluído, bloqueado ou sem visibilidade pública exigida |
| 409 | ID e username correspondem a contas públicas diferentes; informe `by` |
| 429 | Limite por IP/token ou quota da integração |
| 500 | Falha na consulta |
| 503 | Serviço da integração indisponível |

Erros OAuth e de ambiguidade usam JSON com `error` e `error_description`; erros de validação, visibilidade e consulta usam texto. Aplicam-se as [quotas e limites OAuth existentes](../rate-limits.md), com métricas por operação `users.profile`, `users.library`, `users.activity` e `users.collections`.
