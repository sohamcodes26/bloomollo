import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
const slugs = ['debug2ai', 'draft-rescue', 'page-capture', 'page-ink', 'video-speed-booster', 'sound-booster']
const home = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
assert.equal((home.match(/class="product-card"/g) || []).length, 6)
assert.equal((home.match(/<h1\b/g) || []).length, 1)
for (const slug of slugs) {
  const html = await readFile(new URL(`../dist/extensions/${slug}/index.html`, import.meta.url), 'utf8')
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${slug}: single h1`)
  assert.match(html, /name="description"/)
  assert.match(html, /application\/ld\+json/)
  assert.match(html, /Know the boundaries/)
  assert.match(html, /disabled=""/)
  assert.ok(!html.includes('href="#"'), `${slug}: no dead placeholder links`)
  assert.ok(!html.includes('vite.svg'))
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])
  assert.equal(schema['@type'], 'SoftwareApplication')
  assert.ok(!schema.aggregateRating, 'No fabricated ratings')
}
await access(new URL('../dist/fonts/manrope-latin.woff2', import.meta.url))
await access(new URL('../dist/fonts/OFL.txt', import.meta.url))
await access(new URL('../dist/404.html', import.meta.url))
console.log('PASS: six cards, six prerendered product pages, metadata, structured data, unavailable store state, font/license assets, and 404 page.')