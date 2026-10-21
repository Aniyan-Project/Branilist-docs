# Contribuir com a documentação

Obrigado por ajudar a manter a referência utilizável e fiel à API.

## Preparar

```sh
git clone https://github.com/Aniyan-Project/Branilist-docs.git
cd Branilist-docs
npm run check
```

Use Node.js 22+. Não há dependências de produção nem processo de build. Os arquivos Markdown são lidos diretamente no GitHub.

## Alterar o contrato

1. Confirme o comportamento no endpoint ou com os mantenedores; não copie regras de outra API.
2. Atualize a página de referência, os guias afetados e `openapi.json` juntos.
3. Adicione exemplos representativos, indicando que IDs e dados são ilustrativos.
4. Registre mudanças relevantes em `docs/changelog.md`.
5. Execute `npm run check` e confira a renderização Markdown.

## Padrões editoriais

- Use português nos textos, mantendo nomes de campos e códigos exatamente como na API.
- Inclua método, caminho, autenticação/escopo, parâmetros, resposta e erros nas referências.
- Diferencie requisito do servidor de recomendação para o cliente.
- Documente limitações e inconsistências existentes sem inventar funcionalidades.
- Use links relativos entre arquivos para preservar a navegação no GitHub.
- Não publique tokens, segredos, dados pessoais, dumps ou código interno do produto.
- Exemplos executáveis não devem fazer alterações na conta por padrão.

## Relatar problema

Abra uma [issue](https://github.com/Aniyan-Project/Branilist-docs/issues) com a página, comportamento esperado e resultado observado. Remova tokens e dados pessoais. Problemas de segurança devem ser encaminhados pelo canal privado disponibilizado pela equipe Branilist; não publique detalhes sensíveis em uma issue.

O verificador local valida estrutura e exemplos; não comprova que uma implantação esteja disponível nem substitui a revisão do contrato pelos mantenedores.
