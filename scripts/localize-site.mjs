import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

export const languages = ['en', 'es']
async function files(dir) {
  const result=[]
  for(const item of await readdir(dir,{withFileTypes:true})) {
    if(['public','en','es'].includes(item.name)) continue
    const path=join(dir,item.name)
    if(item.isDirectory()) result.push(...await files(path))
    else if(item.name.endsWith('.md')) result.push(path)
  }
  return result
}
async function optionalJSON(path) {
  try{return JSON.parse(await readFile(path,'utf8'))}catch(error){if(error.code==='ENOENT')return {};throw error}
}
export async function localizeSite(root,out,navigation) {
  const originals=await files(out)
  const routes=new Map()
  const entries=[]
  for(const file of originals) {
    const text=await readFile(file,'utf8')
    const source=JSON.parse(text.match(/^source: (.+)$/m)?.[1] ?? '"openapi.json"')
    const route='/'+relative(out,file).replaceAll('\\','/').replace(/(?:index)?\.md$/,'')
    const normalized=route==='/'?'/':route
    if(source!=='openapi.json' && !source.endsWith('.graphql') && normalized!=='/') routes.set(resolve(root,source),normalized)
    entries.push({text,source,route:normalized})
  }
  const result={root:navigation}
  for(const locale of languages) {
    const catalog=await optionalJSON(join(root,'locales',locale,'messages.json'))
    const pairs=Object.entries(catalog).sort((a,b)=>b[0].length-a[0].length)
    const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
    const pattern=pairs.length?new RegExp(pairs.map(([key])=>escape(key)).join('|'),'g'):null
    const translate=text=>pattern?text.replace(pattern,key=>catalog[key]):text
    const prefix='/'+locale
    const localizedRoutes=new Map(routes)
    for(const [file,route] of routes) localizedRoutes.set(resolve(root,'locales',locale,relative(root,file)),route)
    const headings=new Map()
    for(const entry of entries) {
      let text, source=entry.source, fallback=false
      if(source==='graphql/schema.graphql') {
        const path=entry.route.replace(/^\//,'')+(entry.route.endsWith('/')?'index.md':'.md')
        text=await readFile(join(out,locale,path),'utf8')
      } else if(source==='openapi.json') {
        text=entry.text.split(/(^```[^\n]*\n[\s\S]*?^```\s*$)/gm).map((part,i)=>i%2?part:translate(part)).join('')
      } else {
        const file=join(root,'locales',locale,source)
        try {
          text=await readFile(file,'utf8')
          source=relative(root,file).replaceAll('\\','/')
        } catch(error) {if(error.code!=='ENOENT')throw error;text=entry.text;fallback=true}
      }
      // Localize navigation links only; HTTP examples and JSON values stay unchanged.
      text=text.split(/(^```[^\n]*\n[\s\S]*?^```\s*$)/gm).map((part,i)=>{
        if(i%2)return part
        return part.replace(/^(#{1,6}) (.+)$/gm, (_, level, heading) => `${level} ${heading.replaceAll('{', '&#123;').replaceAll('}', '&#125;')}`).replace(/(!?\[[^\]]*\])\(([^)]+)\)/g,(match,label,href)=>{
          if(/^(?:[a-z]+:|#)/i.test(href))return match
          const [path,hash]=href.split('#')
          let route
          if(path.startsWith('/guide/')||path.startsWith('/reference/')||path==='/')route=path
          else if(path.startsWith('/'))return match
          else {
            const absolute=resolve(dirname(resolve(root,source)),decodeURIComponent(path))
            route=localizedRoutes.get(absolute)
            if(!route) {
              const rel=relative(root,absolute).replaceAll('\\','/')
              if(rel.startsWith('../'))throw new Error('Translation link leaves repository: '+href)
              if(rel==='README.md')route='/guide/introduction'
              else return `${label}(${rel==='openapi.json'?'/openapi.json':'/downloads/'+rel}${hash?'#'+hash:''})`
            }
          }
          return `${label}(${prefix}${route}${hash?'#'+hash:''})`
        })
      }).join('')
      text=text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'')
      if(fallback) {
        const notice=locale==='en'?'This page has not been translated yet. The Portuguese original is shown below.':'Esta página todavía no se ha traducido. A continuación se muestra el original en portugués.'
        text=`::: warning\n${notice}\n:::\n\n${text}`
      }
      text=`---\nsource: ${JSON.stringify(source)}\n---\n\n${text}`
      const file=join(out,locale,entry.route.replace(/^\//,'')+(entry.route.endsWith('/')?'index.md':'.md'))
      await mkdir(dirname(file),{recursive:true})
      await writeFile(file,text)
      headings.set(entry.route,text.match(/^#\s+(.+)$/m)?.[1])
    }
    function translateNavigation(value) {
      if(Array.isArray(value))return value.map(translateNavigation)
      if(!value||typeof value!=='object')return value
      return Object.fromEntries(Object.entries(value).map(([key,item])=>{
        if(key==='text')return[key,headings.get(value.link)??translate(item)]
        if(key==='link')return[key,prefix+item]
        return[key,translateNavigation(item)]
      }))
    }
    result[locale]=translateNavigation(navigation)
  }
  await writeFile(join(out,'navigation.json'),JSON.stringify({...navigation,locales:result},null,2)+'\n')
  return result
}
