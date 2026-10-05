import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const origin = 'https://bloomollo.dpdns.org'
const codes = ['en', 'hi', 'de', 'fr', 'es']
const route = code => code === 'en' ? '/image-to-pdf/' : `/${code}/tools/image-to-pdf/`
const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8')
const titles = new Set(), descriptions = new Set()
const downloads = { hi: 'PDF डाउनलोड करें', de: 'PDF herunterladen', fr: 'Télécharger le PDF', es: 'Descargar PDF' }
for (const code of codes) {
  const html = await readFile(new URL(`../dist${route(code)}index.html`, import.meta.url), 'utf8')
  assert.ok(html.includes(`<html lang="${code}"`))
  assert.ok(html.includes(`<link rel="canonical" href="${origin + route(code)}"/>`))
  assert.ok(sitemap.includes(`<loc>${origin + route(code)}</loc>`))
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  assert.match(html, /id="pdf-files"/)
  assert.match(html, /name="robots" content="index,follow/)
  assert.ok(!html.includes('\uFFFD'), 'No corrupted Unicode')
  for (const alternate of [...codes, 'x-default']) {
    const url = origin + route(alternate === 'x-default' ? 'en' : alternate)
    assert.ok(html.includes(`<link rel="alternate" hreflang="${alternate}" href="${url}"/>`), `${code} references ${alternate}`)
  }
  for (const target of codes) assert.ok(html.includes(`href="${route(target)}"`), 'Language selector has crawlable links')
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])
  assert.equal(schema.inLanguage, code)
  assert.equal(schema.url, origin + route(code))
  titles.add(html.match(/<title>(.*?)<\/title>/)[1])
  descriptions.add(html.match(/name="description" content="(.*?)"/)[1])
  if (code !== 'en') {
    assert.ok(html.includes(downloads[code]), `${code}: localized download button`)
    assert.ok(!html.includes('Drop your images here'), `${code}: no English drop-zone label`)
    assert.ok(!html.includes('PDF settings'), `${code}: no English settings label`)
    assert.match(html, /pdf-guide-faq/)
  }
}
assert.equal(titles.size, 5)
assert.equal(descriptions.size, 5)
for (const slug of ['assignment-photos-to-pdf', 'images-to-printable-pdf']) {
  const path = `/guides/${slug}/`
  const html = await readFile(new URL(`../dist${path}index.html`, import.meta.url), 'utf8')
  assert.ok(sitemap.includes(`<loc>${origin + path}</loc>`))
  assert.ok(html.includes(`<link rel="canonical" href="${origin + path}"/>`))
  assert.match(html, /href="\/image-to-pdf\/"/)
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
}
console.log('PASS: five language versions, translated controls, FAQs, reciprocal hreflang, x-default, canonicals, schemas, language links, guides and sitemap.')