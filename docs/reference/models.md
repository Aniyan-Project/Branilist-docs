# Modelos e convenções

[Índice](../README.md) · [OpenAPI](../../openapi.json)

## Convenções gerais

| Assunto | Contrato |
| --- | --- |
| Transporte | HTTPS |
| Dados | JSON UTF-8 nas respostas exitosas, exceto revogação sem corpo |
| Nomes JSON | `camelCase`, exceto tokens OAuth em `snake_case` |
| IDs | Números inteiros; parâmetros de caminho positivos de 64 bits |
| Datas de resposta | Timestamps RFC3339, salvo `startDate`/`endDate` da busca autenticada |
| Datas de escrita na biblioteca | Preferencialmente `YYYY-MM-DD`; também aceita RFC3339, `null` e `""` |
| Listas | Objeto `{ "items": [...] }`, sem envelope `data` |
| Campos indisponíveis | Frequentemente `null`; preserve a diferença entre `null`, 0 e string vazia |

Clientes JavaScript devem considerar a precisão de inteiros acima de `Number.MAX_SAFE_INTEGER`. O servidor serializa IDs como números JSON; escolha um parser apropriado se precisar preservar inteiros de 64 bits sem perda.

## Media: detalhe público

| Campo | Tipo | Significado |
| --- | --- | --- |
| `id` | integer | ID interno Branilist |
| `slug` | string | Identificador textual |
| `type` | string | `ANIME` ou `MANGA` |
| `status` | string | `UPCOMING`, `RELEASING`, `FINISHED`, `CANCELLED`, `HIATUS` |
| `format` | string | Formato, como `TV` ou `MANGA`; trate como string extensível |
| `title` | object | `romaji`, `english`, `native`, `portuguese`; traduções podem ser `null` |
| `description` | string/null | Sinopse |
| `coverImage`, `bannerImage` | string/null | Imagens |
| `episodes`, `chapters` | integer/null | Totais conhecidos |
| `seasonYear` | integer/null | Ano da temporada |
| `averageScore` | integer/null | Nota agregada do catálogo, escala percentual 0–100 |
| `popularity` | integer | Popularidade registrada no catálogo |
| `isAdult` | boolean | Marcação de conteúdo adulto |

`averageScore` não usa a mesma escala de `score` da biblioteca. Não renderize descrições como HTML confiável sem sanitização.

## Modelos resumidos

| Modelo | Campos |
| --- | --- |
| Busca pública | `id`, `slug`, `type`, `format`, `title` (sem `native`), `coverImage`, `averageScore`, `popularity` |
| Mídia embutida na biblioteca | `id`, `slug`, `type`, `title` (sem `native`), `coverImage` |
| Mídia embutida no histórico | `id`, `slug`, `type`, `title` como string, `coverImage` |
| Busca autenticada | Campos próprios descritos em [Conta](account.md), incluindo datas e descrição em inglês |

Não trate esses objetos como o detalhe completo de mídia. Campos ausentes não são necessariamente `null`: cada rota tem seu modelo.

## LibraryEntry

`mediaId`, `status`, `progress`, `score`, `repeatCount`, `startedAt`, `completedAt`, `private`, `updatedAt`, `media`.

Status da **lista do usuário**: `PLANNING`, `CURRENT`, `COMPLETED`, `PAUSED`, `DROPPED`. É diferente de `media.status`, que descreve o lançamento da obra. Progresso e repetições são inteiros; a nota pessoal usa 0.5–10, em intervalos de 0.5, ou `null`.

## HistoryItem

`mediaId`, `eventType`, `status`, `previousStatus`, `progress`, `previousProgress`, `progressDelta`, `score`, `repeatCount`, `createdAt`, `media`. Status/progressos anteriores e nota podem ser nulos; não calcule consumo somando cegamente todos os eventos.

## Collection

`id`, `mediaType`, `name`, `slug`, `description`, `color`, `visibility`, `tags`, `coverMediaId`, `position`, `publishedAt`, `itemCount`, `createdAt`, `updatedAt`.

Não infira o formato de `visibility` a partir das configurações de perfil. Preserve a string devolvida. `description`, `coverMediaId` e `publishedAt` podem ser nulos. `tags` pode ser nulo quando não houver array persistido; o cliente deve tolerar tanto `null` quanto `[]`.

## Compatibilidade

Ignore campos de resposta desconhecidos. Não dependa de ordem de propriedades JSON, ordem de escopos ou de um conjunto fechado de formatos/eventos. O prefixo `/api/v1` identifica a versão do contrato REST; a versão de release do produto não substitui esse prefixo.
