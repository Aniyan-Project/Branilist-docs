# Perguntas frequentes e limites do contrato

[Índice](README.md)

## A API é GraphQL, como a do AniList?

O Branilist oferece REST em `/api/v1` e uma [API GraphQL pública separada](graphql.md) em `/api/graphql`, com OAuth e API keys. O `/graphql` do site tem outro contrato e usa autenticação de sessão. Não envie queries GraphQL às rotas REST.

## Preciso de API key para consultar o catálogo?

Não para as rotas públicas documentadas. Sem chave, há limites por IP. API keys permitem associar consultas de servidor a um aplicativo e têm escopos/quota próprios.

## Posso consultar por ID do MyAnimeList ou AniList?

Sim. Veja [Catálogo](reference/catalog.md). O vínculo precisa existir no Branilist. A resposta usa o ID interno do Branilist, que é o necessário para editar a biblioteca.

## Por que uma entrada da biblioteca foi zerada?

PUT aplica valores padrão a progresso/repetições omitidos e remove a nota se omitida. Não é PATCH. Consulte as regras e preserve os valores na integração antes de escrever.

## Como busco mangá ou respeito a preferência de conteúdo adulto?

Use `/api/v1/me/search` com `library:read` e `type=MANGA`. A busca pública não expõe filtro de tipo e não aplica preferências de uma conta só porque recebeu um token. O detalhe público pode conter `isAdult: true`; aplique as regras de exibição do seu produto.

## Como baixo uma biblioteca com mais de 500 itens?

A rota atual retorna até 500 itens e não expõe paginação. Não há parâmetro documentado que permita varrer o restante por essa API. Histórico tem limite de 200 registros; a busca também é limitada. Não apresente esses resultados como exportação integral garantida.

## Posso criar coleções, fazer reviews ou favoritar pela API pública?

Não há essas operações no contrato `/api/v1` conferido. Webhooks de reviews e coleções não significam que existam rotas REST públicas de escrita desses recursos.

## Posso usar os endpoints de gestão do painel com o access token?

Não. Cadastro de aplicativos, API keys, configuração de webhooks e métricas do painel usam a sessão do proprietário no site. Eles não são parte da superfície OAuth pública deste documento.

## Por que não leio os cabeçalhos de quota no navegador?

Eles não estão expostos pelo CORS atual. Isso não significa quota ilimitada. Leia [Limites e CORS](rate-limits.md).

## Existe sandbox ou SLA?

Esta documentação não estabelece sandbox, SLA, política comercial ou licença sobre o catálogo. Use os ambientes e condições que a equipe disponibilizar, sem presumir que um exemplo fictício corresponde a um recurso de teste público.

## O que pode mudar?

Novos campos podem ser adicionados e formatos/eventos podem evoluir. Ignore campos desconhecidos. Recursos, limites e correções devem ser conferidos com a implementação e registrados no [histórico](changelog.md). A data desta documentação não é uma promessa de que todas as implantações já estejam na mesma revisão.
