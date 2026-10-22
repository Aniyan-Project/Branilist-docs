import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateSite } from './generate-site.mjs'

test('OpenAPI additions, changes and removals regenerate routes; Markdown pages enter navigation', async () => {
  const root = await mkdtemp(join(tmpdir(),'branilist-docs-'))
  try {
    await mkdir(join(root,'docs'),{recursive:true})
    await mkdir(join(root,'site'),{recursive:true})
    await mkdir(join(root,'graphql'),{recursive:true})
    await writeFile(join(root,'graphql','schema.graphql'),'type Query { example(first: Int! = 20): String }')
    await writeFile(join(root,'site','introduction.md'),'# Introdução\n\n[Guia](../docs/example.md)')
    await writeFile(join(root,'CONTRIBUTING.md'),'# Contribuir')
    await writeFile(join(root,'docs','example.md'),'---\ntitle: Guia de exemplo\n---\n# Guia de exemplo\n\n## GET /media/{id}')
    for (const [locale,title] of [['en','Example guide'],['es','Guía de ejemplo']]) {
      await mkdir(join(root,'locales',locale,'docs'),{recursive:true})
      await writeFile(join(root,'locales',locale,'docs','example.md'),`# ${title}\n\n## GET /media/{id}\n\n[Self](example.md)\n\n\`\`\`json\n{"status":"CURRENT"}\n\`\`\``)
      await writeFile(join(root,'locales',locale,'messages.json'),JSON.stringify({'Primeiro título':locale==='en'?'First title':'Primer título'}))
    }
    const operation = summary => ({ summary, operationId:'getExample', tags:['Catálogo'], responses:{200:{description:'OK',content:{'application/json':{schema:{$ref:'#/components/schemas/Success'}}}}} })
    const spec = {paths:{'/api/v1/example':{get:operation('Primeiro título')}},components:{schemas:{Success:{type:'object',properties:{ok:{type:'boolean'}},example:{ok:true}}}}}
    const save = () => writeFile(join(root,'openapi.json'),JSON.stringify(spec))
    await save()
    let result = await generateSite(root)
    assert.equal(result.operations,1)
    assert.match(await readFile(join(root,'.site','en','reference','graphql','index.md'),'utf8'),/first: Int! = 20/)
    assert.match(await readFile(join(root,'.site','es','reference','graphql','index.md'),'utf8'),/Campos|Campo/)
    assert(!((await readFile(join(root,'.site','en','reference','graphql','index.md'),'utf8')).includes('has not been translated')))
    assert(result.locales.en.reference.some(group=>group.text==='GraphQL'))
    const introspection=JSON.parse(await readFile(join(root,'.site','public','downloads','graphql','schema.json'),'utf8'))
    assert.equal(introspection.__schema.queryType.name,'Query')
    assert(result.navigation.guide[0].items.some(i => i.text === 'Guia de exemplo'))
    const generatedGuide = await readFile(join(root,'.site','guide','example.md'),'utf8')
    assert.match(generatedGuide,/title: Guia de exemplo/)
    assert.match(generatedGuide,/&#123;id&#125;/)
    const route = join(root,'.site','reference','operations','get-example.md')
    assert.match(await readFile(route,'utf8'),/Primeiro título/)
    assert.match(await readFile(route,'utf8'),/"ok": true/)
    for (const [locale,title] of [['en','Example guide'],['es','Guía de ejemplo']]) {
      const page=await readFile(join(root,'.site',locale,'guide','example.md'),'utf8')
      assert(page.includes('# '+title))
      assert(page.includes(`[Self](/${locale}/guide/example)`))
      assert(page.includes('source: "locales/'+locale+'/docs/example.md"'))
      assert(page.includes('&#123;id&#125;'))
      assert(page.includes('{"status":"CURRENT"}'))
      assert(result.locales[locale].guide[0].items.some(i=>i.text===title&&i.link===`/${locale}/guide/example`))
      const operation=await readFile(join(root,'.site',locale,'reference','operations','get-example.md'),'utf8')
      assert(operation.includes(locale==='en'?'First title':'Primer título'))
      assert(operation.includes('"ok": true'))
    }
    spec.paths['/api/v1/example'].get.summary='Título atualizado'
    spec.paths['/api/v1/second']={get:{...operation('Segunda rota'),operationId:'getSecond'}}
    spec.paths['/api/v1/second'].get.responses['201']=spec.paths['/api/v1/second'].get.responses['200']
    delete spec.paths['/api/v1/second'].get.responses['200']
    await writeFile(join(root,'docs','new-guide.md'),'# Novo guia')
    await save()
    result=await generateSite(root)
    assert.equal(result.operations,2)
    assert.match(await readFile(join(root,'.site','reference','operations','get-second.md'),'utf8'),/"ok": true/)
    assert.match(await readFile(route,'utf8'),/Título atualizado/)
    assert(result.navigation.guide[0].items.some(i => i.text === 'Novo guia'))
    assert.match(await readFile(join(root,'.site','en','guide','new-guide.md'),'utf8'),/has not been translated yet/)
    assert.match(await readFile(join(root,'.site','es','guide','new-guide.md'),'utf8'),/todavía no se ha traducido/)
    delete spec.paths['/api/v1/example']
    await save()
    result=await generateSite(root)
    assert.equal(result.operations,1)
    await assert.rejects(access(route))
    await assert.rejects(access(join(root,'.site','en','reference','operations','get-example.md')))
    await assert.rejects(access(join(root,'.site','es','reference','operations','get-example.md')))
    assert.match(await readFile(join(root,'.site','guide','introduction.md'),'utf8'),/\[Guia\]\(\/guide\/example\)/)
  } finally {
    // root was created by mkdtemp for this test, outside every repository.
    await rm(root,{recursive:true,force:true})
  }
})
