import { readFile, writeFile, readdir, mkdir, rm, copyFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { localizeSite } from './localize-site.mjs'
import { generateGraphQL } from './generate-graphql.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']
const slug = value => String(value).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const code = value => '`' + cell(value).replaceAll('`', '') + '`'
const fence = (lang, text) => '\n```' + lang + '\n' + text + '\n```\n'
const table = (head, rows) => '| ' + head.join(' | ') + ' |\n| ' + head.map(() => '---').join(' | ') + ' |\n' + rows.map(row => '| ' + row.join(' | ') + ' |').join('\n') + '\n'
const mdTitle = text => text.match(/^#\s+(.+)$/m)?.[1] ?? 'Documentação'

async function markdownFiles(dir) {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...await markdownFiles(path))
    else if (entry.name.endsWith('.md')) result.push(path)
  }
  return result.sort()
}

export async function generateSite(root = projectRoot) {
  root = resolve(root)
  const out = resolve(root, '.site')
  // Only the dedicated generated directory may be replaced, never source files.
  if (dirname(out) !== root || relative(root, out) !== '.site') throw new Error('Invalid generation directory')
  const spec = JSON.parse(await readFile(join(root, 'openapi.json'), 'utf8'))
  const sourceFiles = [...await markdownFiles(join(root, 'docs')), join(root, 'CONTRIBUTING.md')]
  const introduction = join(root, 'site', 'introduction.md')
  sourceFiles.push(introduction)
  const pages = new Map()
  for (const file of sourceFiles) {
    const source = relative(root, file).replaceAll('\\', '/')
    let route
    if (file === introduction) route = '/guide/introduction'
    else if (source === 'CONTRIBUTING.md') route = '/guide/contributing'
    else if (source === 'docs/README.md') route = '/guide/contents'
    else if (source.startsWith('docs/reference/')) route = '/reference/guides/' + source.slice('docs/reference/'.length, -3)
    else route = '/guide/' + source.slice('docs/'.length, -3)
    pages.set(resolve(file), { source, route, text: await readFile(file, 'utf8') })
  }
  const attachURL = source => '/downloads/' + source.split('/').map(encodeURIComponent).join('/')
  const attachments = new Set(['openapi.json'])
  function rewriteLinks(text, file) {
    // Transform Markdown navigation, keeping fenced examples byte-for-byte.
    return text.split(/(^```[^\n]*\n[\s\S]*?^```\s*$)/gm).map((part, index) => {
      if (index % 2) return part
      return part.replace(/^(#{1,6}) (.+)$/gm, (_, level, heading) => `${level} ${heading.replaceAll('{', '&#123;').replaceAll('}', '&#125;')}`).replace(/(!?\[[^\]]*\])\(([^)]+)\)/g, (match, label, href) => {
        if (/^(?:[a-z]+:|#|\/)/i.test(href)) return match
        const [path, hash] = href.split('#')
        const absolute = resolve(dirname(file), decodeURIComponent(path))
        const source = relative(root, absolute).replaceAll('\\', '/')
        if (source.startsWith('../') || source.startsWith('..\\')) throw new Error('Link leaves docs repository: ' + href)
        let url
        if (pages.has(absolute)) url = pages.get(absolute).route
        else if (source === 'README.md') url = '/guide/introduction'
        else { attachments.add(source); url = source === 'openapi.json' ? '/openapi.json' : attachURL(source) }
        return `${label}(${url}${hash ? '#' + hash : ''})`
      })
    }).join('')
  }
  await rm(out, { recursive: true, force: true })
  async function emit(route, text, source = 'openapi.json') {
    const file = join(out, route.replace(/^\//, '') + (route.endsWith('/') ? 'index.md' : '.md'))
    await mkdir(dirname(file), { recursive: true })
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
    const metadata = frontmatter ? frontmatter[1].replace(/^source:.*$/gm, '') + '\n' : ''
    const content = frontmatter ? text.slice(frontmatter[0].length) : text
    await writeFile(file, `---\n${metadata}source: ${JSON.stringify(source)}\n---\n\n${content}`, 'utf8')
  }
  const guideItems = [], manualReference = []
  for (const [file, page] of pages) {
    await emit(page.route, rewriteLinks(page.text, file), page.source)
    const item = { text: mdTitle(page.text), link: page.route }
    if (page.route.startsWith('/reference/')) manualReference.push(item)
    else guideItems.push(item)
  }
  const order = ['introduction','getting-started','authentication','api-keys','errors','rate-limits','webhooks','examples','publishing','faq','changelog','contributing','contents']
  guideItems.sort((a,b) => {
    const rank = item => { const i = order.indexOf(item.link.split('/').at(-1)); return i < 0 ? 100 : i }
    return rank(a) - rank(b) || a.text.localeCompare(b.text, 'pt-BR')
  })
  await emit('/', rewriteLinks(pages.get(introduction).text, introduction), 'site/introduction.md')

  function deref(schema = {}) {
    if (!schema.$ref) return schema
    const parts = schema.$ref.slice(2).split('/').map(x => x.replaceAll('~1','/').replaceAll('~0','~'))
    return parts.reduce((obj,key) => obj?.[key], spec) ?? {}
  }
  function type(schema = {}) {
    if (schema.$ref) {
      const name = schema.$ref.split('/').at(-1)
      return `[${cell(name)}](/reference/schemas/${slug(name)})`
    }
    if (schema.anyOf || schema.oneOf) return (schema.anyOf ?? schema.oneOf).map(type).join(' ou ')
    if (schema.allOf) return schema.allOf.map(type).join(' + ')
    if (schema.type === 'array') return 'array de ' + type(schema.items)
    return cell(Array.isArray(schema.type) ? schema.type.join(' ou ') : schema.type ?? 'valor JSON') + (schema.format ? ' (' + cell(schema.format) + ')' : '')
  }
  function rules(schema = {}) {
    const parts = [schema.description]
    if (schema.enum) parts.push('Valores: ' + schema.enum.map(code).join(', '))
    if (schema.const !== undefined) parts.push('Valor: ' + code(schema.const))
    if (schema.minimum !== undefined) parts.push('Mínimo: ' + schema.minimum)
    if (schema.maximum !== undefined) parts.push('Máximo: ' + schema.maximum)
    if (schema.multipleOf !== undefined) parts.push('Passo: ' + schema.multipleOf)
    if (schema.minLength !== undefined) parts.push('Comprimento mínimo: ' + schema.minLength)
    if (schema.maxLength !== undefined) parts.push('Comprimento máximo: ' + schema.maxLength)
    if (schema.default !== undefined) parts.push('Padrão: ' + code(JSON.stringify(schema.default)))
    return parts.filter(Boolean).map(cell).join(' · ') || '—'
  }
  function fields(schema = {}) {
    schema = deref(schema)
    if (schema.oneOf || schema.anyOf) return (schema.oneOf ?? schema.anyOf).map((choice,i) => `### Alternativa ${i+1}\n\n${fields(choice)}`).join('\n')
    const properties = schema.properties
    if (!properties) return `Tipo: ${type(schema)}. ${cell(schema.description ?? '')}\n`
    return table(['Campo','Tipo','Obrigatório','Descrição'], Object.entries(properties).map(([name, value]) => [code(name), type(value), schema.required?.includes(name) ? 'Sim' : 'Não', rules(value)]))
  }
  function example(schema = {}, depth = 0) {
    if (depth > 5) return null
    schema = { ...deref(schema), ...schema }
    if (schema.example !== undefined) return schema.example
    if (schema.default !== undefined) return schema.default
    if (schema.const !== undefined) return schema.const
    if (schema.enum?.length) return schema.enum[0]
    if (schema.anyOf || schema.oneOf) return example((schema.anyOf ?? schema.oneOf)[0], depth+1)
    if (schema.type === 'object' || schema.properties) return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key,s]) => [key, example(s,depth+1)]))
    if (schema.type === 'array') return [example(schema.items,depth+1)]
    if (schema.type === 'integer') return schema.minimum ?? 1
    if (schema.type === 'number') return schema.minimum ?? 0
    if (schema.type === 'boolean') return false
    if (schema.type === 'null') return null
    if (schema.format === 'date') return '2026-10-21'
    if (schema.format === 'date-time') return '2026-10-21T12:00:00Z'
    if (schema.format === 'uri') return 'https://seu-app.example/callback'
    if (schema.minLength) return 'x'.repeat(schema.minLength)
    return 'exemplo'
  }
  const apiGroups = new Map(), operationRows = [], operationLinks = new Set()
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of methods) {
      const operation = pathItem[method]
      if (!operation) continue
      const name = slug(operation.operationId ?? method + '-' + path)
      const route = '/reference/operations/' + name
      if (!name || operationLinks.has(route)) throw new Error('Duplicate or empty operation slug: ' + name)
      operationLinks.add(route)
      const tag = operation.tags?.[0] ?? 'Outras rotas'
      if (!apiGroups.has(tag)) apiGroups.set(tag, [])
      apiGroups.get(tag).push({ text: operation.summary ?? method.toUpperCase() + ' ' + path, link: route })
      operationRows.push([code(method.toUpperCase()), `[${code(path)}](${route})`, cell(operation.summary ?? '')])
      const security = operation.security ?? spec.security ?? []
      const auth = security.length ? security.map(alternative => Object.keys(alternative).length
        ? Object.entries(alternative).map(([scheme, scopes]) => code(scheme) + (scopes.length ? ': ' + scopes.map(code).join(', ') : '')).join(' e ')
        : 'Sem credencial').join(' **ou** ') : 'Sem credencial'
      let text = `# ${cell(operation.summary ?? method.toUpperCase() + ' ' + path)}\n\n<p class="api-endpoint"><span class="http-method http-${method}">${method.toUpperCase()}</span><code>${cell(path)}</code></p>\n\n${operation.description ?? ''}\n\n## Autenticação\n\n${auth}.\n`
      if (operation['x-api-key-scopes']?.length) text += '\nSe enviar API key: ' + operation['x-api-key-scopes'].map(code).join(', ') + '.\n'
      const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].map(deref)
      text += '\n## Parâmetros\n\n' + (parameters.length ? table(['Nome','Local','Tipo','Obrigatório','Descrição'], parameters.map(p => [code(p.name),code(p.in),type(p.schema),p.required ? 'Sim':'Não',cell(p.description ?? '')])) : 'Esta operação não declara parâmetros de caminho ou query no OpenAPI.\n')
      const body = deref(operation.requestBody)
      if (operation.requestBody) {
        text += '\n## Corpo da requisição\n\n' + (body.required ? 'Obrigatório.' : 'Opcional.') + '\n'
        for (const [mime, media] of Object.entries(body.content ?? {})) text += '\n### ' + code(mime) + '\n\n' + fields(media.schema) + (mime === 'application/json' ? fence('json', JSON.stringify(media.example ?? example(media.schema), null, 2)) : '')
      }
      let curl = `curl --fail-with-body -X ${method.toUpperCase()} '${(spec.servers?.[0]?.url ?? 'https://branilist.com') + path.replace(/\{[^}]+\}/g,'123')}'`
      const query = parameters.filter(p => p.in === 'query' && p.required)
      if (query.length) curl = curl.replace(/'$/, (curl.includes('?') ? '&' : '?') + query.map(p => encodeURIComponent(p.name) + '=exemplo').join('&') + "'")
      if (security.some(s => Object.keys(s).some(k => spec.components.securitySchemes[k]?.type === 'oauth2'))) curl += ' \\\n  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"'
      const bodyMedia = Object.entries(body.content ?? {})[0]
      if (bodyMedia) {
        const [mime, media] = bodyMedia
        curl += ` \\\n  -H 'Content-Type: ${mime}'`
        const payload = media.example ?? example(media.schema)
        if (mime === 'application/json') curl += ` \\\n  --data '${JSON.stringify(payload).replaceAll("'", "'\\''")}'`
        else if (payload && typeof payload === 'object') for (const [key,value] of Object.entries(payload)) curl += ` \\\n  --data-urlencode '${key}=${String(value).replaceAll("'", "'\\''")}'`
      }
      text += '\n## Exemplo de requisição\n\nValores gerados são ilustrativos: substitua IDs, parâmetros e credenciais antes de executar.\n' + fence('sh',curl)
      text += '\n## Respostas\n'
      for (const [status, value] of Object.entries(operation.responses ?? {})) {
        const response = deref(value)
        text += '\n### ' + code(status) + '\n\n' + (response.description ?? '') + '\n'
        if (!response.content) text += '\nSem corpo de resposta declarado.\n'
        for (const [mime, media] of Object.entries(response.content ?? {})) text += '\n' + code(mime) + '\n\n' + fields(media.schema) + (/^2\d\d$/.test(status) && mime === 'application/json' ? fence('json',JSON.stringify(media.example ?? example(media.schema),null,2)) : '')
      }
      text += '\n## Fonte e detalhes\n\nEsta página é gerada de [openapi.json](/openapi.json). Confira os [erros](/guide/errors) e os [limites](/guide/rate-limits). As regras adicionais de cada recurso estão nos guias da referência.\n'
      await emit(route,text)
    }
  }
  const schemaItems = []
  for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
    const route = '/reference/schemas/' + slug(name)
    schemaItems.push({ text: name, link: route })
    await emit(route, '# ' + name + '\n\n' + (schema.description ?? '') + '\n\n## Campos\n\n' + fields(schema) + '\n## Exemplo ilustrativo\n' + fence('json',JSON.stringify(example(schema),null,2)))
  }
  await emit('/reference/', '# Referência da API\n\nAs operações e os modelos desta seção são gerados automaticamente de [openapi.json](/openapi.json). Use os guias para os detalhes de comportamento e os exemplos de integração.\n\n## Operações\n\n' + table(['Método','Rota','Descrição'], operationRows) + '\n## Modelos JSON\n\n' + schemaItems.map(item => `- [${item.text}](${item.link})`).join('\n'))
  const navigation = {
    guide: [{ text: 'Guia da API', items: guideItems }],
    reference: [{ text: 'Visão geral', items: [{ text: 'Todas as operações', link: '/reference/' }, ...manualReference] }, ...[...apiGroups].map(([text, items]) => ({ text, collapsed: false, items })), { text: 'Modelos JSON', collapsed: true, items: schemaItems }]
  }
  const graphqlNavigation = await generateGraphQL(root,out)
  if (graphqlNavigation) navigation.reference.push(graphqlNavigation)
  const locales = await localizeSite(root,out,navigation)
  for (const source of attachments) {
    const target = source === 'openapi.json' ? join(out,'public','openapi.json') : join(out,'public','downloads',source)
    await mkdir(dirname(target),{ recursive:true })
    await copyFile(join(root,source),target)
  }
  return { operations: operationLinks.size, schemas: schemaItems.length, pages: pages.size, navigation, locales }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await generateSite()
  console.log(`Site prepared: ${result.pages} Markdown pages, ${result.operations} operations, ${result.schemas} schemas.`)
}
