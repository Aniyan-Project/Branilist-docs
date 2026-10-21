---
name: Branilist API Docs
description: Documentação de leitura em VitePress, com guias e referência REST.
colors:
  brand-light: "#a54708"
  brand-light-hover: "#bb520b"
  brand-light-solid: "#cf6117"
  brand-light-soft: "rgba(207, 97, 23, .12)"
  brand-dark: "#ffb77d"
  brand-dark-hover: "#ffa45e"
  brand-dark-solid: "#f79243"
  brand-dark-soft: "rgba(255, 164, 94, .12)"
  page-light: "#ffffff"
  sidebar-light: "#f6f6f7"
  page-dark: "#10141c"
  sidebar-dark: "#0d1118"
  elevated-dark: "#1a202c"
  soft-dark: "#171d27"
  text-light: "#3c3c43"
  text-dark: "#dfdfd6"
  get-light-text: "#166534"
  get-light-bg: "#e7f4ea"
  post-light-text: "#1e40af"
  post-light-bg: "#eaf0fe"
  put-patch-light-text: "#92400e"
  put-patch-light-bg: "#fff1d9"
  delete-light-text: "#9f1239"
  delete-light-bg: "#ffe9ef"
  get-dark-text: "#a0e6b5"
  get-dark-bg: "#163326"
  post-dark-text: "#b3ccff"
  post-dark-bg: "#1c2d4c"
  put-patch-dark-text: "#ffd89c"
  put-patch-dark-bg: "#3d2c19"
  delete-dark-text: "#ffb5c6"
  delete-dark-bg: "#40212c"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-.02em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
  method:
    fontFamily: "ui-monospace, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: ".75rem"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  method: "5px"
spacing:
  endpoint-gap: ".75rem"
  endpoint-margin-block: "1.5rem"
components:
  method-get:
    backgroundColor: "{colors.get-light-bg}"
    textColor: "{colors.get-light-text}"
    typography: "{typography.method}"
    rounded: "{rounded.method}"
    padding: ".2rem .5rem"
  method-post:
    backgroundColor: "{colors.post-light-bg}"
    textColor: "{colors.post-light-text}"
    typography: "{typography.method}"
    rounded: "{rounded.method}"
    padding: ".2rem .5rem"
  method-put-patch:
    backgroundColor: "{colors.put-patch-light-bg}"
    textColor: "{colors.put-patch-light-text}"
    typography: "{typography.method}"
    rounded: "{rounded.method}"
    padding: ".2rem .5rem"
  method-delete:
    backgroundColor: "{colors.delete-light-bg}"
    textColor: "{colors.delete-light-text}"
    typography: "{typography.method}"
    rounded: "{rounded.method}"
    padding: ".2rem .5rem"
---

# Design System: Branilist API Docs

## Overview

**Creative North Star: "Documentação para leitura"**

A direção confirmada é a organização familiar de documentação VitePress, com a referência de leitura do AniList. A interface em português privilegia localizar uma operação, entender parâmetros e ler exemplos. O nome Branilist e o acento quente identificam o site sem disputar atenção com o texto.

O tema padrão do VitePress fornece os componentes e a hierarquia. As personalizações observadas ajustam a marca, os fundos escuros, a legibilidade e os identificadores HTTP. Esta documentação descreve a implementação atual; os valores herdados continuam sob responsabilidade do tema instalado.

**Key Characteristics:**
- Leitura central com navegação lateral e índice contextual.
- Acento quente com pares específicos para temas claro e escuro.
- Código e identificadores de API em tipografia monoespaçada.
- Controles e padrões de navegação familiares do VitePress.

## Colors

A marca usa cobre no tema claro e pêssego no tema escuro, sobre superfícies neutras.

### Primary

- **Cobre de leitura:** marca e links no tema claro; as variantes hover, sólida e suave preservam os papéis do VitePress.
- **Pêssego de leitura:** equivalente da marca no tema escuro, incluindo hover e seleção suave.

### Secondary

- **Verde GET, azul POST, âmbar PUT/PATCH e rosa DELETE:** pares de texto e fundo exclusivos dos rótulos de método. Os pares escuros têm fundos mais profundos e texto mais claro. O método escrito acompanha a cor.

### Neutral

- **Página clara e lateral clara:** branco e cinza herdados do VitePress.
- **Página escura e lateral escura:** fundos separados por tom; superfícies elevadas e suaves usam os tokens próprios do tema escuro.
- **Texto claro e texto escuro:** cores principais herdadas do VitePress, adaptadas à superfície de cada aparência.

**The Semantic Method Rule.** A cor de método acompanha sempre seu identificador textual; PUT e PATCH compartilham o mesmo par.

## Typography

**Body Font:** Inter, com ui-sans-serif, system-ui e sans-serif como alternativas, conforme a variável base local do VitePress.

**Label/Mono Font:** a pilha monoespaçada do próprio VitePress: ui-monospace, Menlo, Monaco, Consolas, Liberation Mono, Courier New e monospace.

A hierarquia é a de documentação do tema. O título principal usa o papel headline do frontmatter e cresce para (32px) a partir de (768px); mantém a entrelinha e o ajuste de letras local. Títulos de segundo nível usam o papel title; o terceiro nível herdado usa (20px), peso (600), entrelinha (28px) e ajuste (-.01em). Parágrafos e itens de lista usam a entrelinha local do papel body; ela não se aplica indiscriminadamente a tabelas e controles.

Rótulos de método usam o papel method. Código de exemplos, caminhos e nomes de campo preservam a apresentação monoespaçada do framework.

## Layout

O limite externo local é (1480px); ele não é a largura de leitura. O VitePress limita a coluna do documento com índice a (688px), mantém a lateral nominal em (272px) e disponibiliza o índice de títulos de níveis 2 e 3 à direita em telas largas. A lateral se torna persistente a partir de (960px); o índice lateral aparece a partir de (1280px). Em telas menores, os controles do tema dão acesso à navegação e ao índice.

A referência usa as mesmas áreas de leitura dos guias. O cabeçalho de operação é uma linha flexível que pode quebrar entre o método e o caminho; gap e margens estão no frontmatter. Caminhos longos podem quebrar dentro do código desse cabeçalho. Tabelas preservam identificadores curtos: a primeira coluna tem mínimo de (6rem), a segunda de (5rem), e código na primeira coluna não quebra. A rolagem de tabelas e blocos de código segue o tema.

## Elevation & Depth

A leitura é plana e organizada por fundos, divisores e espaço. A personalização não adiciona sombras. Busca e navegação móvel preservam a elevação e as transições dos componentes VitePress; não se estabelece uma escala própria de sombras.

## Shapes

Os componentes herdados preservam seus contornos do VitePress. Rótulos HTTP têm cantos discretos definidos pelo token method. Não existe uma nova escala global de raios nesta personalização.

## Components

### Navigation

O cabeçalho oferece Guia, Referência e Branilist, além do acesso ao GitHub. Links ativos e hover usam a marca; os grupos laterais acompanham as páginas geradas. O índice se chama “Nesta página”, e a navegação entre documentos usa “Anterior” e “Próxima”.

### Search and appearance

A busca local usa o componente do VitePress e o texto “Buscar”. O controle “Aparência” alterna os temas. Campos, botões e diálogos preservam as formas e estados do framework; não há um formulário ou botão promocional próprio.

### HTTP methods and endpoint header

Rótulos compactos combinam os pares semânticos do frontmatter com peso forte e código monoespaçado. São identificadores informativos, sem hover ou clique. O caminho acompanha o rótulo no cabeçalho flexível de operação.

### Reference tables and code

Tabelas apresentam nomes, tipos e descrições sem fragmentar os identificadores curtos. Exemplos usam blocos de código do VitePress e seus controles de cópia. Conteúdo técnico determina a estrutura, sem introduzir cartões decorativos.

### Focus, selection and motion

O foco visível usa contorno de marca (2px) com afastamento (4px). A seleção usa texto principal sobre a marca suave. Links do documento têm sublinhado afastado (.2em). A preferência por movimento reduzido desativa a rolagem suave local e mantém o tratamento reduzido do tema.

## Do's and Don'ts

### Do:
- **Do** manter a leitura e a navegação familiares do VitePress.
- **Do** usar os pares claros e escuros existentes para marca, superfícies e métodos.
- **Do** preservar identificadores curtos nas tabelas e permitir quebra de caminhos longos nos cabeçalhos de operação.
- **Do** preservar foco visível, seleção legível e preferência por movimento reduzido.

### Don't:
- **Don't** transformar a documentação em uma landing page promocional.
- **Don't** comunicar métodos HTTP somente pela cor.
- **Don't** aplicar a entrelinha de parágrafos a todos os controles e tabelas.
