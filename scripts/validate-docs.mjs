import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
async function files(dir) {
  const result = []
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (['.git','node_modules'].includes(item.name)) continue
    const full = join(dir, item.name)
    result.push(...(item.isDirectory() ? await files(full) : [full]))
  }
  return result
}
let links = 0
const all = await files(root)
for (const path of all.filter(path => path.endsWith('.md'))) {
  const text = await readFile(path, 'utf8')
  assert.equal((text.match(/^```/gm) ?? []).length % 2, 0, `Unbalanced code fences: ${path}`)
  // Skip fenced examples so illustrative URLs/code are not treated as navigation.
  const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '')
  for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1].split('#')[0]
    if (!href || /^[a-z]+:/i.test(href)) continue
    await stat(resolve(dirname(path), decodeURIComponent(href)))
    links++
  }
  for (const match of text.matchAll(/^```json\s*\n([\s\S]*?)^```/gm)) JSON.parse(match[1])
}
const spec = JSON.parse(await readFile(join(root, 'openapi.json'), 'utf8'))
assert.equal(spec.openapi, '3.1.0')
const ids = new Set()
let operations = 0
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    assert(['get','put','post','delete'].includes(method))
    assert(!ids.has(operation.operationId), 'Duplicate operationId')
    ids.add(operation.operationId)
    for (const name of path.matchAll(/\{([^}]+)\}/g)) assert(operation.parameters?.some(p => p.name === name[1] && p.in === 'path' && p.required))
    assert(operation.responses['200'])
    for (const alternative of operation.security ?? []) for (const name of Object.keys(alternative)) assert(spec.components.securitySchemes[name])
    operations++
  }
}
assert.equal(operations, 14)
assert.equal([...ids].length, 14)
function visit(value) {
  if (!value || typeof value !== 'object') return
  if (value.$ref) {
    assert(value.$ref.startsWith('#/'))
    let target = spec
    for (const piece of value.$ref.slice(2).split('/')) target = target?.[piece.replaceAll('~1','/').replaceAll('~0','~')]
    assert(target, `Unresolved ref ${value.$ref}`)
  }
  Object.values(value).forEach(visit)
}
visit(spec)
for (const path of all.filter(path => path.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
}
console.log(`OK: ${links} relative links, JSON examples, 14 operations, local OpenAPI refs and JS syntax.`)
