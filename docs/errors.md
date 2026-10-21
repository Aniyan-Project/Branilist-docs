# Erros e recuperação

[Índice](README.md) · [Limites](rate-limits.md) · [FAQ](faq.md)

O contrato atual tem **dois formatos de erro**. Verifique o status e o `Content-Type` antes de interpretar o corpo.

## JSON de OAuth, chaves e quotas

```json
{"error":"invalid_token","error_description":"token ausente, expirado ou sem escopo"}
```

| Código | Status habitual | Ação |
| --- | --- | --- |
| `invalid_request` | 400 | Revise o formulário e os parâmetros OAuth |
| `unsupported_grant_type` | 400 | Use um grant suportado |
| `invalid_grant` | 400 | Confira código/verifier/redirect ou obtenha novo consentimento |
| `invalid_client` | 401 | Confira client ID e secret |
| `invalid_token` | 401 | Verifique token, validade, revogação e escopo |
| `invalid_api_key` | 401 | Confira chave e seu escopo |
| `slow_down` | 429 | Aguarde para emitir tokens |
| `rate_limited` | 429 | Respeite a janela de limite |
| `quota_exceeded` | 429 | Aguarde a renovação da quota ou confira a configuração do app |
| `quota_unavailable` | 503 | Tente depois, com espera progressiva |

## Texto simples

Validações e falhas de consulta podem usar `text/plain; charset=utf-8`:

```text
invalid media id
```

Exemplos: `q must have at least 2 chars` (400), `not found` (404), `query failed` (500), `update failed` (500), `integration unavailable` (503).

Não presuma que todo erro seja JSON. Um proxy também pode emitir respostas de erro próprias. Use `X-Request-ID`, quando presente, para correlacionar a ocorrência sem compartilhar tokens.

## Particularidades atuais

- Falta de escopo nas rotas públicas OAuth é reportada como **401**, não como 403.
- Os handlers legados de `/me`, busca pessoal, leitura/atualização da biblioteca, histórico e coleções chamam o limitador antes de autenticar. Bearer ausente ou vazio pode produzir **429 `rate_limited`**; isso não prova que a quota foi consumida. Verifique o cabeçalho no cliente antes de reenviar.
- `DELETE /me/library/{mediaId}` verifica token vazio explicitamente e retorna **401**.
- PUT de mídia interna inexistente pode responder **500**, em vez de 404.
- DELETE sem entrada responde **200** com `removed: false`.
- CORS, proxy e infraestrutura podem rejeitar chamadas antes do endpoint.

## Repetição segura

Repita leituras em falhas transitórias com espera exponencial e variação aleatória. Respeite `Retry-After` quando disponível. Evite repetir automaticamente uma escrita se você não sabe se o servidor a confirmou: releia o estado primeiro. DELETE de biblioteca é idempotente; PUT não oferece chave de idempotência documentada nem verificação de versão. Não reutilize um código OAuth ou refresh token já consumido.

O cliente [request.mjs](../examples/request.mjs) lida com erro JSON e texto sem expor tokens na mensagem.
