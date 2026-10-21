# Publicação e atualização automática

[Índice](README.md)

O site é publicado no **GitHub Pages** em [aniyan-project.github.io/Branilist-docs](https://aniyan-project.github.io/Branilist-docs/). Ele usa VitePress com busca local, navegação lateral, temas claro/escuro e uma referência gerada do OpenAPI.

## Fluxo de atualização

1. Edite os guias em `docs/`, a introdução em `site/introduction.md` ou as operações em `openapi.json`.
2. Envie a alteração para a branch `main` do repositório de documentação.
3. O workflow **Publicar documentação** valida o conteúdo e os exemplos, gera o site e publica no Pages.

Pull requests passam pela validação e build, mas não substituem a versão pública. Também é possível executar o workflow manualmente pela aba Actions.

**Não use `[skip ci]` em alterações que precisam disparar a publicação por push.** Esse marcador impede o início do workflow de publicação. Se um commit já foi enviado com o marcador, execute o workflow manualmente.

## Documentar uma rota nova

Adicione a operação sob `paths` em `openapi.json`. Inclua método, `operationId` único, título `summary`, tag, autenticação, parâmetros e respostas. Para um corpo JSON, adicione `requestBody` e o schema correspondente em `components.schemas` quando necessário.

No próximo build são criados automaticamente:

- A página da operação e sua entrada na navegação lateral.
- O catálogo de operações da referência.
- As tabelas de parâmetros e schemas de request/response.
- Exemplos ilustrativos de requisição e de resposta, quando houver schema.
- As páginas dos modelos JSON e o índice da busca.

Alterar uma operação atualiza sua página. Removê-la do OpenAPI remove sua página gerada no próximo build. Mantenha `operationId` estável para preservar o endereço da documentação. Os exemplos gerados usam valores ilustrativos: complemente `example` no OpenAPI para exemplos mais específicos.

Este fluxo não lê automaticamente o código do backend. Quando uma rota da API mudar, atualize seu contrato no OpenAPI e revise também os guias de comportamento. O gerador não consegue inferir semântica de negócio apenas a partir de um método e caminho.

## Adicionar um guia

Crie um arquivo `.md` em `docs/`, com um título de primeiro nível. O arquivo será descoberto e adicionado à navegação automaticamente. Arquivos em `docs/reference/` aparecem entre os guias da referência. Links relativos continuam funcionando no GitHub e são adaptados na geração do site.

Não edite `.site/`: é conteúdo temporário regenerado. Os arquivos originais permanecem legíveis no GitHub.

## Executar localmente

```sh
npm ci
npm run check
npm run docs:dev
```

Para verificar a versão de produção:

```sh
npm run docs:build
npm run docs:preview
```

Se adicionar ou remover arquivos de navegação durante o servidor de desenvolvimento, reinicie `docs:dev` para regenerar o conteúdo. O deploy sempre faz uma geração completa.

## Configuração do GitHub Pages

O repositório usa a fonte **GitHub Actions** em Settings → Pages. O workflow recebe permissão `pages: write` e `id-token: write` apenas no job de deploy; o build usa leitura do repositório. A publicação não precisa de token pessoal nem acesso ao repositório privado da API.

O prefixo do site é `/Branilist-docs/`. Se mudar o nome do repositório ou usar um domínio próprio, ajuste `base` e `sitemap.hostname` em `.vitepress/config.mts`.

## Diagnóstico

| Sintoma | Confira |
| --- | --- |
| Alteração não apareceu | Execução do workflow, branch principal, marcador skip-ci e conclusão do deploy |
| Build falhou | Logs de validação, links Markdown, JSON e referências de schemas |
| Rota não entrou no menu | Operação em `paths`, método suportado e `operationId` único |
| CSS ou navegação quebrados | Prefixo `base` do Pages |
| Exemplos genéricos | Preencha `example` nos schemas ou no content da operação |
