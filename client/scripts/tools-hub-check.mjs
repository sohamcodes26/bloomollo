import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = file => readFile(new URL('../dist/' + file, import.meta.url), 'utf8')
const home = await read('index.html')
const hub = await read('tools/index.html')
const sitemap = await read('sitemap.xml')
assert.match(home, /href="\/tools\/"/)
assert.match(home, /href="\/tools\/image-to-pdf\/"/)
assert.equal((hub.match(/<h1\b/g) || []).length, 1)
assert.match(hub, /<title>Free Image to PDF Tools/)
assert.match(hub, /<link rel="canonical" href="https:\/\/bloomollo\.dpdns\.org\/tools\/"/)
assert.match(hub, /name="robots" content="index,follow/)
assert.match(sitemap, /<loc>https:\/\/bloomollo\.dpdns\.org\/tools\/<\/loc>/)
for (const slug of ['image', 'jpg', 'png', 'webp', 'avif', 'bmp', 'gif']) {
  assert.ok(hub.includes(`href="/tools/${slug}-to-pdf/"`), `${slug}: crawlable initial HTML link`)
  await read(`tools/${slug}-to-pdf/index.html`)
}
assert.ok(!hub.includes('A little off the path.'))
console.log('PASS: tools hub prerendering, homepage discovery, seven converter links, canonical, robots and sitemap.')