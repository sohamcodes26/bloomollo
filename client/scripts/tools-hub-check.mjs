import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = file => readFile(new URL('../dist/' + file, import.meta.url), 'utf8')
const home = await read('index.html')
const hub = await read('tools/index.html')
const sitemap = await read('sitemap.xml')
const hubCss = await readFile(new URL('../src/components/tools-hub.css', import.meta.url), 'utf8')
assert.ok(!hubCss.includes('\uFEFF'), 'hub stylesheet must not contain an embedded BOM that breaks its theme selector')
assert.match(hubCss, /(?:^|\n)\.tools-hub\{--hub-bg:/, 'default dark palette must target the tools hub')
// Guard theme hierarchy as well as selector syntax: a missing token makes the
// entire background declaration invalid and silently flattens cards/filters.
const palette = selector => {
  const body = hubCss.slice(hubCss.indexOf(selector) + selector.length).split('}')[0]
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):([^;\}]+)/g)].map(match => [match[1], match[2]]))
}
const luminance = hex => {
  const full = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex
  const rgb = full.slice(1).match(/../g).map(c => parseInt(c, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
for (const selector of ['.tools-hub{', '[data-theme="light"] .tools-hub{']) {
  const tokens = palette(selector)
  for (const token of ['--hub-bg', '--hub-card', '--hub-card-hover', '--hub-ink', '--hub-muted', '--hub-border', '--hub-blue', '--hub-active-bg', '--hub-active-ink', '--hub-active-border']) {
    assert.match(tokens[token] || '', /^#[\da-f]{3}(?:[\da-f]{3})?$/i, `${selector} ${token}: complete, valid palette`)
  }
  assert.notEqual(tokens['--hub-card'], tokens['--hub-bg'], 'cards must have their own surface')
  assert.ok(contrast(tokens['--hub-card'], tokens['--hub-bg']) >= 1.1, 'card surface must visibly separate from the page')
  for (const surface of ['--hub-bg', '--hub-card', '--hub-card-hover']) {
    for (const ink of ['--hub-ink', '--hub-muted', '--hub-blue']) {
      assert.ok(contrast(tokens[ink], tokens[surface]) >= 4.5, `${selector} ${ink} on ${surface}: readable normal text`)
    }
  }
  assert.ok(contrast(tokens['--hub-active-ink'], tokens['--hub-active-bg']) >= 4.5, 'selected category text contrast')
}
assert.match(hubCss, /aria-pressed="true"\]\{background:var\(--hub-active-bg\)/, 'selected categories use explicit theme tokens')
assert.match(hubCss, /aria-pressed="true"\] span\{background:var\(--hub-active-ink\);color:var\(--hub-active-bg\)/, 'selected category count has an explicit contrasting badge')
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