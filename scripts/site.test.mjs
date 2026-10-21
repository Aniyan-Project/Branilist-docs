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
    await writeFile(join(root,'site','introduction.md'),'# Introdução\n\n[Guia](../docs/example.md)')
    await writeFile(join(root,'CONTRIBUTING.md'),'# Contribuir')
    await writeFile(join(root,'docs','example.md'),'---\ntitle: Guia de exemplo\n---\n# Guia de exemplo\n\n## GET /media/{id}')
    const operation = summary => ({ summary, operationId:'getExample', tags:['Catálogo'], responses:{200:{description:'OK',content:{'application/json':{schema:{$ref:'#/components/schemas/Success'}}}}} })
    const spec = {paths:{'/api/v1/example':{get:operation('Primeiro título')}},components:{schemas:{Success:{type:'object',properties:{ok:{type:'boolean'}},example:{ok:true}}}}}
    const save = () => writeFile(join(root,'openapi.json'),JSON.stringify(spec))
    await save()
    let result = await generateSite(root)
    assert.equal(result.operations,1)
    assert(result.navigation.guide[0].items.some(i => i.text === 'Guia de exemplo'))
    const generatedGuide = await readFile(join(root,'.site','guide','example.md'),'utf8')
    assert.match(generatedGuide,/title: Guia de exemplo/)
    assert.match(generatedGuide,/&#123;id&#125;/)
    const route = join(root,'.site','reference','operations','get-example.md')
    assert.match(await readFile(route,'utf8'),/Primeiro título/)
    assert.match(await readFile(route,'utf8'),/"ok": true/)
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
    delete spec.paths['/api/v1/example']
    await save()
    result=await generateSite(root)
    assert.equal(result.operations,1)
    await assert.rejects(access(route))
    assert.match(await readFile(join(root,'.site','guide','introduction.md'),'utf8'),/\[Guia\]\(\/guide\/example\)/)
  } finally {
    // root was created by mkdtemp for this test, outside every repository.
    await rm(root,{recursive:true,force:true})
  }
})
