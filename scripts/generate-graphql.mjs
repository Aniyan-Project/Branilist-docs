import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { buildSchema, validateSchema, isObjectType, isInputObjectType, isEnumType, isScalarType, introspectionFromSchema, astFromValue, print } from 'graphql'

const labels={
 root:{title:'API GraphQL pública',intro:'Esta referência é gerada do schema público. Campos, argumentos e tipos acompanham o SDL a cada build. Consulte o [guia GraphQL](/guide/graphql) para autenticação, privacidade, exemplos e limites.',types:'Tipos',field:'Campo',type:'Tipo',args:'Argumentos',values:'Valores',download:'Baixar schema SDL',json:'Baixar introspecção JSON',source:'Fonte',scalar:'Escalar. Consulte o guia para formato e convenções.'},
 en:{title:'Public GraphQL API',intro:'This reference is generated from the public schema. Fields, arguments and types follow the SDL on every build. See the [GraphQL guide](/en/guide/graphql) for authentication, privacy, examples and limits.',types:'Types',field:'Field',type:'Type',args:'Arguments',values:'Values',download:'Download SDL schema',json:'Download JSON introspection',source:'Source',scalar:'Scalar. See the guide for format and conventions.'},
 es:{title:'API GraphQL pública',intro:'Esta referencia se genera desde el schema público. Los campos, argumentos y tipos siguen el SDL en cada build. Consulta la [guía GraphQL](/es/guide/graphql) para autenticación, privacidad, ejemplos y límites.',types:'Tipos',field:'Campo',type:'Tipo',args:'Argumentos',values:'Valores',download:'Descargar schema SDL',json:'Descargar introspección JSON',source:'Fuente',scalar:'Escalar. Consulta la guía para formato y convenciones.'}
}
const slug=name=>name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()
const code=value=>'`'+value+'`'
export async function generateGraphQL(root,out){
 const source='graphql/schema.graphql'
 let sdl
 try{sdl=await readFile(join(root,source),'utf8')}catch(error){if(error.code==='ENOENT')return null;throw error}
 const schema=buildSchema(sdl)
 const errors=validateSchema(schema);if(errors.length)throw Error(errors.map(e=>e.message).join('\n'))
 const types=Object.values(schema.getTypeMap()).filter(t=>!t.name.startsWith('__')).sort((a,b)=>a.name.localeCompare(b.name))
 const links=types.map(t=>({text:t.name,link:'/reference/graphql/types/'+slug(t.name)}))
 for(const [locale,t] of Object.entries(labels)){
  const prefix=locale==='root'?'':'/'+locale
  const write=async(path,text)=>{const target=join(out,prefix,path);await mkdir(dirname(target),{recursive:true});await writeFile(target,'---\nsource: '+JSON.stringify(source)+'\n---\n\n'+text+'\n')}
  const downloads=`[${t.download}](/downloads/graphql/schema.graphql) · [${t.json}](/downloads/graphql/schema.json)`
  let index=`# ${t.title}\n\n${t.intro}\n\n${downloads}\n\n## Queries\n\n`
  for(const [heading,object] of [['Queries',schema.getQueryType()],['Mutations',schema.getMutationType()]]){
   if(!object)continue
   if(heading==='Mutations')index+='\n## Mutations\n\n'
   index+=`| ${t.field} | ${t.type} | ${t.args} |\n| --- | --- | --- |\n`
   for(const field of Object.values(object.getFields()))index+=`| ${code(field.name)} | ${code(field.type)} | ${argumentsText(field.args)} |\n`
  }
  index+=`\n## ${t.types}\n\n`+links.map(i=>`- [${i.text}](${prefix+i.link})`).join('\n')
  await write('/reference/graphql/index.md',index)
  for(const type of types){
   let text=`# ${type.name}\n\n[GraphQL](${prefix}/reference/graphql/) · ${downloads}\n\n`
   if(isObjectType(type)||isInputObjectType(type)){
    text+=`| ${t.field} | ${t.type} | ${t.args} |\n| --- | --- | --- |\n`
    for(const field of Object.values(type.getFields()))text+=`| ${code(field.name)} | ${code(field.type)} | ${argumentsText(field.args??[])} |\n`
   }else if(isEnumType(type)){text+=`## ${t.values}\n\n`+type.getValues().map(v=>'- '+code(v.name)).join('\n')}
   else if(isScalarType(type)){text+=t.scalar}
   await write('/reference/graphql/types/'+slug(type.name)+'.md',text)
  }
 }
 const download=join(out,'public','downloads','graphql');await mkdir(download,{recursive:true})
 await copyFile(join(root,source),join(download,'schema.graphql'))
 await writeFile(join(download,'schema.json'),JSON.stringify(introspectionFromSchema(schema),null,2)+'\n')
 return {text:'GraphQL',collapsed:true,items:[{text:labels.root.title,link:'/reference/graphql/'},...links]}
}
function argumentsText(args){
 if(!args.length)return '—'
 return args.map(arg=>{
  const literal=arg.astNode?.defaultValue??(arg.defaultValue===undefined?null:astFromValue(arg.defaultValue,arg.type))
  const value=literal?' = '+print(literal):''
  return code(arg.name+': '+arg.type+value)
 }).join(', ')
}
