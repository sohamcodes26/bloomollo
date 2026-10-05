import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const slugs = ['jpg', 'png', 'webp', 'avif', 'bmp', 'gif']
const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8')
const titles = new Set(), descriptions = new Set()
for (const format of slugs) {
  const route = `/tools/${format}-to-pdf/`
  const html = await readFile(new URL(`../dist${route}index.html`, import.meta.url), 'utf8')
  const url = `https://bloomollo.dpdns.org${route}`
  assert.ok(html.includes(`<link rel="canonical" href="${url}"`))
  assert.ok(sitemap.includes(`<loc>${url}</loc>`))
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  assert.match(html, /id="pdf-files"/)
  assert.match(html, /name="robots" content="index,follow/)
  assert.match(html, /aria-label="Image conversion formats"/)
  titles.add(html.match(/<title>(.*?)<\/title>/)[1])
  descriptions.add(html.match(/name="description" content="(.*?)"/)[1])
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])
  assert.equal(schema['@type'], 'WebApplication')
  assert.equal(schema.url, url)
  assert.equal(schema.offers.price, '0')
  assert.ok(!schema.aggregateRating)
  for (const other of slugs) assert.ok(html.includes(`href="/tools/${other}-to-pdf/"`))
}
assert.equal(titles.size, slugs.length)
assert.equal(descriptions.size, slugs.length)
console.log('PASS: six format routes, rendered converter, unique metadata, canonical URLs, schemas, internal links and sitemap entries.')