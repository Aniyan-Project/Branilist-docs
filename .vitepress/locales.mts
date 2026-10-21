import { readFileSync } from 'node:fs'
const navigation=JSON.parse(readFileSync(new URL('../.site/navigation.json',import.meta.url),'utf8'))
const ui = {
  root: { label:'Português', lang:'pt-BR', guide:'Guia', reference:'Referência', description:'Guias e referência da API pública REST do Branilist.', outline:'Nesta página', menu:'Navegação', top:'Voltar ao início', appearance:'Aparência', light:'Usar tema claro', dark:'Usar tema escuro', skip:'Ir para o conteúdo', previous:'Anterior', next:'Próxima', edit:'Editar esta página no GitHub', language:'Idioma', search:'Buscar', searchAria:'Buscar na documentação', noResults:'Nenhum resultado para', reset:'Limpar busca', select:'selecionar', navigate:'navegar', close:'fechar' },
  en: { label:'English', lang:'en', guide:'Guide', reference:'Reference', description:'Guides and reference for the Branilist public REST API.', outline:'On this page', menu:'Navigation', top:'Back to top', appearance:'Appearance', light:'Switch to light theme', dark:'Switch to dark theme', skip:'Skip to content', previous:'Previous', next:'Next', edit:'Edit this page on GitHub', language:'Language', search:'Search', searchAria:'Search documentation', noResults:'No results for', reset:'Clear search', select:'select', navigate:'navigate', close:'close' },
  es: { label:'Español', lang:'es', guide:'Guía', reference:'Referencia', description:'Guías y referencia de la API REST pública de Branilist.', outline:'En esta página', menu:'Navegación', top:'Volver al inicio', appearance:'Apariencia', light:'Usar tema claro', dark:'Usar tema oscuro', skip:'Ir al contenido', previous:'Anterior', next:'Siguiente', edit:'Editar esta página en GitHub', language:'Idioma', search:'Buscar', searchAria:'Buscar en la documentación', noResults:'Sin resultados para', reset:'Borrar búsqueda', select:'seleccionar', navigate:'navegar', close:'cerrar' }
}
export const searchLocales=Object.fromEntries(Object.entries(ui).map(([key,t])=>[key,{translations:{
  button:{buttonText:t.search,buttonAriaLabel:t.searchAria},
  modal:{noResultsText:t.noResults,resetButtonTitle:t.reset,footer:{selectText:t.select,navigateText:t.navigate,closeText:t.close}}
}}]))
export const locales=Object.fromEntries(Object.entries(ui).map(([key,t])=>{
  const prefix=key==='root'?'':'/'+key
  const n=navigation.locales[key]
  return[key,{label:t.label,lang:t.lang,description:t.description,themeConfig:{
    nav:[{text:t.guide,link:prefix+'/guide/introduction',activeMatch:`^${prefix}/(guide/|$)`},{text:t.reference,link:prefix+'/reference/',activeMatch:`^${prefix}/reference/`},{text:'Branilist',link:'https://branilist.com'}],
    sidebar:{[prefix+'/guide/']:n.guide,[prefix+'/reference/']:n.reference,[prefix+'/']:n.guide},
    outline:{level:[2,3],label:t.outline},sidebarMenuLabel:t.menu,returnToTopLabel:t.top,
    darkModeSwitchLabel:t.appearance,lightModeSwitchTitle:t.light,darkModeSwitchTitle:t.dark,
    skipToContentLabel:t.skip,langMenuLabel:t.language,docFooter:{prev:t.previous,next:t.next},
    editLink:{text:t.edit,pattern:({frontmatter})=>`https://github.com/Aniyan-Project/Branilist-docs/edit/main/${frontmatter.source??'openapi.json'}`}
  }}]
}))
