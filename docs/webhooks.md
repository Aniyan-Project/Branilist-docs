# Webhooks

[Índice](README.md) · [Verificador de assinatura](../examples/webhook-signature.mjs)

Webhooks enviam eventos para um servidor HTTPS da integração. Cadastre a URL, o aplicativo e os eventos pelo [painel de desenvolvedores](https://branilist.com/settings/developer). A gestão do webhook depende da sessão do proprietário no painel; não são rotas de administração disponíveis com um access token em `/api/v1`.

## Eventos disponíveis

| Evento | Escopo associado |
| --- | --- |
| `library.updated` | `library:read` |
| `review.created` | `activity:read` |
| `review.updated` | `activity:read` |
| `review.deleted` | `activity:read` |
| `collection.created` | `collections:read` |
| `collection.updated` | `collections:read` |
| `collection.deleted` | `collections:read` |

A entrega de eventos pessoais depende da configuração da integração, da autorização correspondente e dos escopos. Não há evento público `library.deleted` documentado. Não suponha que toda alteração da conta produza um webhook nem que o payload seja um espelho completo de um endpoint REST. Releia o estado pela API quando necessário.

## Requisição recebida

```http
POST /seu-webhook HTTP/1.1
Content-Type: application/json
User-Agent: Branilist-Webhooks/1.0
X-Branilist-Event: library.updated
X-Branilist-Delivery: 123
X-Branilist-Timestamp: 1792584000
X-Branilist-Signature: v1=HEX_DO_HMAC_SHA256
```

```json
{
  "id": "evt_123",
  "type": "library.updated",
  "createdAt": "2026-10-21T12:00:00Z",
  "data": {"userId":42,"mediaId":123}
}
```

O conteúdo de `data` acima é ilustrativo: seus campos variam por evento. O envelope usa `id`, `type`, `createdAt` e `data`. O teste de entrega pelo painel usa `integration.test`; aceite esse evento de teste separadamente dos eventos assinados na configuração.

## Verificar a assinatura

Use o segredo do webhook para calcular:

```text
mensagem = timestamp + "." + corpo_HTTP_original
assinatura = "v1=" + HEX(HMAC_SHA256(segredo, mensagem))
```

O `timestamp` é o valor textual do cabeçalho. Capture os bytes originais antes de fazer parse de JSON; serializar novamente pode mudar espaços e ordem de propriedades, invalidando a assinatura.

O [exemplo Node.js](../examples/webhook-signature.mjs) verifica assinatura em tempo constante e aplica uma janela de 5 minutos para reduzir replay. Essa janela é uma política do exemplo, não uma exigência do servidor. Mantenha o relógio sincronizado e não aceite silenciosamente timestamps inválidos.

## Confirmar e tratar duplicatas

- Responda com status **2xx** após aceitar a entrega. O corpo de resposta não precisa ter formato específico.
- Grave o evento em uma fila durável e processe tarefas demoradas fora da requisição.
- Aplique deduplicação por ID de entrega/evento; uma repetição automática pode ocorrer após falha de rede.
- Não suponha ordenação global nem entrega exatamente uma vez. Uma repetição manual pode gerar um novo ID de entrega.

## Tentativas e destino

O cliente de entrega usa timeout de **12 segundos** e não segue redirecionamentos. Cadastre a URL HTTPS final, publicamente acessível. Loopback, redes privadas e link-local são bloqueados, inclusive após resolução DNS.

A espera entre falhas usa 1 minuto, 5 minutos, 30 minutos, 2 horas e, para tentativas posteriores configuradas, 12 horas. O limite efetivo de tentativas pertence à configuração da entrega. Consulte falhas, testes e repetição manual pelo painel. A programação das tentativas depende do worker estar em execução.

Ao trocar o segredo, atualize o receptor e a configuração de forma coordenada. Não registre o segredo nem tokens em logs de diagnóstico.
