# Biblioteca pessoal

[Índice](../README.md) · [OAuth](../authentication.md) · [Modelos](models.md)

O usuário é determinado pelo access token. Todas as operações recebem o **ID interno do Branilist**, inclusive após uma consulta por MAL/AniList.

| Método | Caminho | Escopo |
| --- | --- | --- |
| GET | `/api/v1/me/library` | `library:read` |
| PUT | `/api/v1/me/library/{mediaId}` | `library:write` |
| DELETE | `/api/v1/me/library/{mediaId}` | `library:write` |

## GET /api/v1/me/library

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/library' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

Retorna 200 com `items`, ordenado pela atualização mais recente. Inclui até **500 entradas**, sem paginação, filtro ou cursor. A biblioteca pode incluir entradas privadas do próprio dono do token.

```json
{
  "items": [{
    "mediaId": 123,
    "status": "CURRENT",
    "progress": 3,
    "score": 8.5,
    "repeatCount": 0,
    "startedAt": "2026-10-01T00:00:00Z",
    "completedAt": null,
    "private": false,
    "updatedAt": "2026-10-21T12:00:00Z",
    "media": {
      "id": 123, "slug": "exemplo-anime", "type": "ANIME",
      "title": {"romaji": "Exemplo", "english": "Example", "portuguese": null},
      "coverImage": null
    }
  }]
}
```

## PUT /api/v1/me/library/{mediaId}

Cria a entrada se não existir ou atualiza a existente. Envie `Content-Type: application/json`.

```sh
curl --fail-with-body -X PUT 'https://branilist.com/api/v1/me/library/123' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"status":"CURRENT","progress":3,"score":8.5,"repeatCount":0,"startedAt":"2026-10-01","private":false}'
```

| Campo | Regra | Se omitido |
| --- | --- | --- |
| `status` | Obrigatório: `PLANNING`, `CURRENT`, `COMPLETED`, `PAUSED` ou `DROPPED`; normalizado para maiúsculas | Requisição inválida |
| `progress` | Inteiro não negativo; episódios em anime, capítulos em mangá | **0**, inclusive em entrada existente |
| `score` | `null` ou número entre **0.5 e 10**, em passos de **0.5** | **Remove a nota** |
| `repeatCount` | Inteiro não negativo | **0**, inclusive em entrada existente |
| `startedAt` | `YYYY-MM-DD`, RFC3339, `null` ou string vazia | Preserva a data; em `CURRENT`, preenche a data atual se ainda não existir |
| `completedAt` | Mesmos formatos de `startedAt` | Preserva a data; em `COMPLETED`, preenche a data atual se ainda não existir |
| `private` | Booleano; determina a privacidade da entrada | Preserva na atualização; `false` na criação |

**PUT não é um patch parcial.** Para preservar progresso, nota e repetições, leia os valores atuais e envie-os novamente. O servidor não faz controle de versão da entrada; coordene escritas concorrentes na integração.

Para limpar uma data, envie explicitamente `null` ou `""`. As datas são persistidas como datas de calendário; prefira `YYYY-MM-DD`. Os campos de leitura são timestamps serializados. O endpoint público atual não impõe o total de episódios/capítulos como limite nem valida a ordem entre as datas. Não dependa dessa ausência de validação para enviar dados inconsistentes.

Resposta **200**, tanto para criação quanto para atualização:

```json
{"ok":true,"mediaId":123}
```

Mudanças efetivas são registradas no histórico. Entradas privadas não publicam atividade de lista no feed. Não há campo de notas textuais neste payload.

Erros: 400 para ID, JSON ou campos inválidos; 401 para token inválido/sem escopo; 429 para limite/quota; 500 para falha de atualização, inclusive quando a mídia interna não existe. Não presuma um 404 nessa escrita. Consulte [as particularidades de erros](../errors.md).

## DELETE /api/v1/me/library/{mediaId}

```sh
curl --fail-with-body -X DELETE 'https://branilist.com/api/v1/me/library/123' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

Não envie corpo. Apenas a entrada do dono do token é removida; a mídia permanece no catálogo. Favoritos e coleções não são excluídos.

```json
{"ok":true,"mediaId":123,"removed":true}
```

Se a entrada já não existir, responde 200 com `removed: false`. Isso inclui um ID positivo que não corresponda a uma entrada do usuário. A remoção e o evento `REMOVED` são persistidos na mesma transação. Repetir a chamada não duplica o evento. A resposta inclui `Cache-Control: no-store`.

Erros: 400 para ID inválido; 401 para token ausente, inválido, expirado, revogado ou sem escopo; 429 para limite/quota; 500 para falha de exclusão. Essa rota não utiliza 204 nem 404 para ausência da entrada.
