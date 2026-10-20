import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { productionOrigin } from '../site.config.mjs'

assert.equal(productionOrigin, 'https://bloomollo.tech')
const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])
assert.ok(urls.length > 0)
assert.equal(new Set(urls).size, urls.length)
const titles = new Set()
for (const address of urls) {
  const url = new URL(address)
  assert.equal(url.origin, productionOrigin)
  assert.notEqual(url.pathname, '/404/')
  const html = await readFile(`dist${url.pathname}index.html`, 'utf8')
  assert.ok(!html.includes('bloomollo.dpdns.org'), address)
  assert.ok(html.includes(`rel="canonical" href="${address}"`), address)
  assert.ok(html.includes(`property="og:url" content="${address}"`), address)
  assert.ok(html.includes('name="description" content="'), address)
  assert.ok(!html.includes('content="noindex"'), address)
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, address)
  const title = html.match(/<title>(.*?)<\/title>/)?.[1]
  assert.ok(title, address)
  assert.ok(!titles.has(title), `Duplicate title: ${title}`)
  titles.add(title)
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
    const schema = JSON.parse(match[1])
    if (schema['@type'] === 'WebApplication') {
      assert.equal(schema.url, address)
      assert.equal(schema.description, html.match(/name="description" content="(.*?)"/)?.[1]?.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>'))
    }
  }
}
assert.ok((await readFile('dist/robots.txt', 'utf8')).includes(`Sitemap: ${productionOrigin}/sitemap.xml`))
console.log(`PASS: ${urls.length} sitemap URLs, unique titles, H1s, canonical/OG URLs, structured data, robots and new-domain coverage.`)