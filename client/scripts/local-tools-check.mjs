import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('../src/converters/local-tools/model.ts', import.meta.url), 'utf8')
const { outputText: code } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
const { parsePages, safeFilename } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
assert.deepEqual(parsePages('', 3), [1, 2, 3])
assert.deepEqual(parsePages('3,1-2,2', 4), [1, 2, 3])
for (const range of ['0', '4', '3-1', 'x', '1,', '1.5', '-1']) assert.throws(() => parsePages(range, 3))
assert.equal(safeFilename('../../hello.pdf'), '-hello')
const urlSource = await readFile(new URL('../src/converters/local-tools/html-url.ts', import.meta.url), 'utf8')
const urlCode = ts.transpileModule(urlSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { loadHtmlUrl } = await import('data:text/javascript;base64,' + Buffer.from(urlCode).toString('base64'))
const originalFetch = globalThis.fetch
const signal = new AbortController().signal
try {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://example.com/page')
    assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.signal, signal)
    return new Response('<h1>Imported</h1>', { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }
  assert.equal(await loadHtmlUrl('https://example.com/page', signal), '<h1>Imported</h1>')
  for (const url of ['bad-url', 'javascript:alert(1)', 'file:///a.html', 'https://user:pass@example.com']) await assert.rejects(loadHtmlUrl(url, signal))
  globalThis.fetch = async () => new Response('missing', { status: 404 })
  await assert.rejects(loadHtmlUrl('https://example.com', signal), /HTTP 404/)
  globalThis.fetch = async () => new Response('{}', { headers: { 'content-type': 'application/json' } })
  await assert.rejects(loadHtmlUrl('https://example.com', signal), /HTML document/)
  globalThis.fetch = async () => new Response(' ', { headers: { 'content-type': 'text/html' } })
  await assert.rejects(loadHtmlUrl('https://example.com', signal), /empty document/)
  globalThis.fetch = async () => new Response('a', { headers: { 'content-type': 'text/html', 'content-length': '1000001' } })
  await assert.rejects(loadHtmlUrl('https://example.com', signal), /smaller than 1 MB/)
  globalThis.fetch = async () => new Response('a'.repeat(1_000_001), { headers: { 'content-type': 'text/html' } })
  await assert.rejects(loadHtmlUrl('https://example.com', signal), /smaller than 1 MB/)
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(loadHtmlUrl('https://example.com', signal), /Failed to fetch/)
} finally { globalThis.fetch = originalFetch }
console.log('PASS: HTML URL imports, credential omission, URL validation, HTTP errors, content types and streamed size limits.')
for (const slug of ['pdf-to-jpg', 'html-to-pdf']) {
  const html = await readFile(new URL(`../dist/${slug}/index.html`, import.meta.url), 'utf8')
  assert.match(html, new RegExp(`rel="canonical" href="https://bloomollo.tech/${slug}/"`))
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  assert.ok(!html.includes('A little off the path.'))
  const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8')
  const hub = await readFile(new URL('../dist/tools/index.html', import.meta.url), 'utf8')
  assert.ok(sitemap.includes(`/${slug}/`)); assert.ok(hub.includes(`href="/${slug}/"`))
}
console.log('PASS: local tool page selection, validation, filenames, routes, canonicals, directory links and sitemap.')