# Limites, cache e CORS

[Índice](README.md) · [Erros](errors.md)

## Limites de referência

Valores da implementação conferida; infraestrutura e configuração do aplicativo podem impor limites adicionais. As janelas do limitador são de um minuto, não uma promessa de disponibilidade.

| Acesso | Limite |
| --- | --- |
| Detalhe público sem API key, incluindo MAL/AniList | 240 chamadas/minuto por IP, compartilhadas entre as três rotas |
| Busca pública sem API key | 120 chamadas/minuto por IP |
| Rotas de usuário OAuth | 300 chamadas/minuto por token, compartilhadas |
| Emissão/renovação em `/oauth/token` | 120 chamadas/minuto por client ID |
| App autenticado, camada adicional | Configurável por aplicativo **e operação**, padrão inicial 120/minuto |
| Quota diária de app autenticado | Configurável, padrão inicial 10.000 requisições |

API keys e OAuth compartilham a quota diária do aplicativo. Chamadas que chegam à reserva de quota contam mesmo se depois terminarem com erro ou forem atendidas pelo cache. Erros anteriores à reserva não necessariamente contam.

## Cabeçalhos de uso

Quando a camada de quotas do aplicativo estiver ativa:

| Cabeçalho | Significado |
| --- | --- |
| `X-RateLimit-Limit` | **Quota diária** do app, não o limite por minuto |
| `X-RateLimit-Remaining` | Restante diário após reservar a chamada |
| `X-RateLimit-Reset` | Timestamp Unix da próxima meia-noite UTC informado pela API |
| `Retry-After` | Segundos para aguardar; presente em algumas rejeições de limite por minuto |

Os cabeçalhos podem não estar presentes em chamadas anônimas ou rejeições antecipadas. A contabilização diária utiliza a data do banco; confira o painel se houver diferença entre o reset informado e a quota efetiva da implantação.

## Cache de catálogo

| Rota | `Cache-Control` |
| --- | --- |
| Detalhe por ID interno/MAL/AniList | `public, max-age=30, stale-while-revalidate=120` |
| Busca pública | `public, max-age=15, stale-while-revalidate=60` |
| Busca autenticada | `private, no-store` |
| Exclusão de biblioteca / emissão de tokens | `no-store` |

Consultas de catálogo usam `X-Branilist-Cache: HIT` ou `MISS`. O cache interno tem duração configurável e não precisa coincidir com `max-age`. IDs externos e internos têm entradas de cache separadas; uma alteração pode aparecer em instantes diferentes. Não há garantia de leitura imediatamente atualizada após uma escrita na biblioteca.

Não use cache compartilhado para respostas pessoais, mesmo nas rotas que ainda não enviam `no-store` explicitamente. Não presuma suporte a ETag, `If-None-Match` ou resposta 304.

## CORS

As rotas `/api/v1`, `/oauth/token` e `/oauth/revoke` permitem origem `*`, sem credenciais de cookie. Envie Bearer com `fetch`, sem `credentials: 'include'`.

Atualmente o navegador pode ler `X-Request-ID` e `X-Branilist-Cache`, mas os cabeçalhos `X-RateLimit-*` e `Retry-After` não estão na lista de exposição CORS. Eles continuam disponíveis para clientes de servidor. `X-Branilist-API-Key` também não está entre os cabeçalhos de preflight permitidos: mantenha essa chave no backend.

Métodos CORS anunciados: GET, POST, PUT, PATCH, DELETE e OPTIONS. Isso não cria rotas PATCH na API v1. Um preflight OPTIONS exitoso não garante permissão para executar a operação.
