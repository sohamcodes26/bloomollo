import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = file => readFile(new URL('../dist/' + file, import.meta.url), 'utf8')
const home = await read('index.html')
const hub = await read('tools/index.html')
const sitemap = await read('sitemap.xml')
assert.match(home, /href="\/tools\/"/)
assert.match(home, /href="\/image-to-pdf\/"/)
assert.equal((hub.match(/<h1\b/g) || []).length, 1)
assert.match(hub, /<title>Free PDF Tools/)
assert.match(hub, /<link rel="canonical" href="https:\/\/bloomollo\.tech\/tools\/"/)
assert.match(hub, /name="robots" content="index,follow/)
assert.match(sitemap, /<loc>https:\/\/bloomollo\.tech\/tools\/<\/loc>/)
for (const slug of ['image', 'jpg', 'png', 'webp', 'avif', 'bmp', 'gif']) {
  const route = slug === 'image' ? 'image-to-pdf/' : `tools/${slug}-to-pdf/`
  assert.ok(hub.includes(`href="/${route}"`), `${slug}: crawlable initial HTML link`)
  await read(`${route}index.html`)
}
assert.ok(!hub.includes('A little off the path.'))
assert.equal((hub.match(/class="tools-card tools-tone-/g) || []).length, 26, 'all 26 tools are visible before hydration')
const filters = hub.match(/<div class="tools-filters"[^>]*>(.*?)<\/div>/)?.[1] || ''
assert.equal((filters.match(/aria-pressed="true"/g) || []).length, 1, 'one category selected initially')
assert.match(hub, /aria-label="Filter document tools"/)
for (const category of ['All tools', 'Convert to PDF', 'Convert from PDF']) assert.ok(hub.includes(category))
for (const route of ['pdf-to-jpg', 'html-to-pdf']) assert.ok(hub.includes(`href="/${route}/"`))
console.log('PASS: tools hub prerendering, 26 tool cards, category controls, converter links, canonical, robots and sitemap.')