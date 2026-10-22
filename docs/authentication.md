# OAuth 2.0 com PKCE

Consulte os [Termos de Uso da API](terms-of-use.md) antes de utilizar os recursos de integração.

[Fórum e Spaces](forum.md)
[Índice](README.md) · [API keys](api-keys.md) · [Exemplo PKCE](../examples/pkce.mjs) · [Comunidade, reviews e notificações](community.md)

O Branilist usa **Authorization Code + PKCE S256**. A autorização ocorre no navegador; a troca e a renovação de tokens usam formulários HTTP. Não use o login e a senha do usuário na integração.

## Cadastrar o aplicativo

No [painel de desenvolvedores](https://branilist.com/settings/developer), cadastre o aplicativo e suas URLs de retorno.

| Tipo | Uso | Client secret |
| --- | --- | --- |
| `PUBLIC` | Aplicativo distribuído ou cliente que não consegue guardar segredo | Não é exigido |
| `CONFIDENTIAL` | Backend que mantém credenciais em ambiente protegido | Exigido na troca e na renovação |

O cadastro admite de 1 a 8 redirect URIs. Elas usam HTTPS, com exceção de HTTP em `localhost`, `127.0.0.1` e `::1`. Não são aceitos fragmentos, credenciais embutidas ou curingas. A URL enviada ao autorizar e trocar o código deve corresponder exatamente a uma URL cadastrada, incluindo caminho, porta e barra final.

## Escopos públicos

| Escopo | Permissão |
| --- | --- |
| `profile:read` | Ler o perfil do dono do token |
| `library:read` | Ler biblioteca e usar a busca autenticada |
| `library:write` | Criar, substituir dados ou remover entradas da biblioteca |
| `activity:read` | Ler o histórico pessoal |
| `collections:read` | Ler as coleções do dono do token |

Separe escopos por espaço. Solicite apenas os necessários e confira se estão permitidos nas configurações do aplicativo. `library:write` não concede `library:read` implicitamente. Os escopos `profile`, `list:read` e `list:write` pertencem à integração de extensão e não substituem os desta tabela.

## Fluxo completo

1. Gere `state` imprevisível, um `code_verifier` aleatório e seu `code_challenge`.
2. Guarde `state` e `code_verifier` de forma associada à tentativa de login.
3. Abra a página de autorização no navegador.
4. No callback, verifique primeiro o `state`; trate a recusa e só depois troque o `code`.
5. Guarde o par de tokens e descarte os dados temporários da tentativa.

### Gerar PKCE

`code_verifier` tem 43–128 caracteres dos conjuntos `A-Z`, `a-z`, `0-9`, `-._~`.

```text
code_challenge = BASE64URL_SEM_PADDING(SHA256(code_verifier))
code_challenge_method = S256
```

O challenge tem 43 caracteres. `plain` não é aceito. Execute o [gerador de exemplo](../examples/pkce.mjs); gere um verifier novo a cada tentativa.

### Autorizar no navegador

```text
https://branilist.com/oauth/authorize
  ?response_type=code
  &client_id=SEU_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fseu-app.example%2Fcallback
  &scope=profile%3Aread%20library%3Aread%20library%3Awrite
  &state=VALOR_ALEATORIO
  &code_challenge=CHALLENGE_S256
  &code_challenge_method=S256
```

A URL acima está quebrada em linhas para leitura; envie uma URL única com parâmetros codificados. O usuário faz login e aprova as permissões no Branilist.

Sucesso no callback: `?code=...&state=...`. Recusa: `?error=access_denied&state=...`. O código expira em **10 minutos** e só pode ser usado uma vez. O `state` é uma proteção que o seu cliente precisa gerar e validar.

### Trocar o código

```sh
curl --fail-with-body 'https://branilist.com/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'client_id=SEU_CLIENT_ID' \
  --data-urlencode 'code=CODIGO_DO_CALLBACK' \
  --data-urlencode 'redirect_uri=https://seu-app.example/callback' \
  --data-urlencode 'code_verifier=VERIFIER_DA_MESMA_TENTATIVA'
```

Para `CONFIDENTIAL`, envie também `client_secret` no formulário ou use HTTP Basic com o client ID como usuário e o secret como senha. Se houver Basic, seus valores prevalecem sobre os campos do formulário. Não envie JSON ao endpoint de tokens.

```json
{
  "access_token": "ACCESS_TOKEN_ILUSTRATIVO",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "REFRESH_TOKEN_ILUSTRATIVO",
  "scope": "library:read library:write profile:read"
}
```

A ordem dos escopos não é relevante. A resposta inclui `Cache-Control: no-store`.

## Usar o access token

```http
Authorization: Bearer ACCESS_TOKEN
```

O token identifica o usuário. Cookies de login e API keys não substituem esse cabeçalho nos endpoints `/api/v1/me`.

## Renovar

Access tokens expiram em **1 hora**; refresh tokens expiram em **30 dias** e são rotacionados.

```sh
curl --fail-with-body 'https://branilist.com/oauth/token' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode 'client_id=SEU_CLIENT_ID' \
  --data-urlencode 'refresh_token=SEU_REFRESH_TOKEN'
```

Clientes confidenciais enviam o secret também nessa chamada. A resposta contém um novo par de tokens. Substitua os dois de forma atômica: o refresh token anterior deixa de ser utilizável. Coordene chamadas concorrentes para não reutilizar o mesmo refresh token. A renovação não permite ampliar escopos; novas permissões exigem novo consentimento.

## Revogar

```sh
curl --fail-with-body 'https://branilist.com/oauth/revoke' \
  --data-urlencode 'token=TOKEN_A_REVOGAR'
```

Retorna **200 sem corpo**, inclusive se o token não for reconhecido. Revoga o token informado, não necessariamente seu par. Para encerrar a integração, revogue access e refresh token ou remova a autorização pelo painel da conta. Não interprete a resposta como prova de que o token existia.

## Diagnóstico

| Problema | Verificação |
| --- | --- |
| Autorização inválida | `response_type=code`, client ID, URI exata, escopos permitidos, challenge S256 |
| `invalid_client` | Client ID e secret do cliente confidencial |
| `invalid_grant` | Código expirado/usado, verifier incorreto, URI divergente ou refresh token revogado |
| `unsupported_grant_type` | Use `authorization_code` ou `refresh_token` |
| `slow_down` | Respeite o limite de emissão de tokens |

Veja [erros](errors.md) para diferenças de formato e status entre endpoints.
