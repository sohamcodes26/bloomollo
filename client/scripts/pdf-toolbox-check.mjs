import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import ts from 'typescript'
import { PDFDocument, degrees, decodePDFRawStream } from 'pdf-lib'
const temp = new URL('./.pdf-engine-check.mjs', import.meta.url)
const source = await readFile(new URL('../src/converters/pdf-tools/engine.ts', import.meta.url), 'utf8')
await writeFile(temp, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText)
try {
  const { buildPdf, initialSettings, splitGroups, inspectForm, fillForm } = await import(temp.href)
  const pdf = await PDFDocument.create()
  pdf.addPage([300, 400]); pdf.addPage([500, 600]); pdf.addPage([700, 800])
  const bytes = await pdf.save()
  const items = [0, 1, 2].map(index => ({ file: 0, index, selected: true, rotation: 0 }))
  const build = async (pages, operation, settings = initialSettings) => PDFDocument.load(await buildPdf([bytes], pages, operation, settings))
  assert.deepEqual((await build([items[2], items[0]], 'merge-pdf')).getPages().map(p => p.getWidth()), [700, 300])
  assert.equal((await build([items[1]], 'extract-pages')).getPageCount(), 1)
  assert.equal((await build([{ ...items[0], rotation: 90 }], 'rotate-pdf')).getPage(0).getRotation().angle, 90)
  assert.deepEqual((await build([items[0]], 'crop-pdf')).getPage(0).getCropBox(), { x: 24, y: 24, width: 252, height: 352 })
  await assert.rejects(build([items[0]], 'crop-pdf', { ...initialSettings, crop: 160 }), /Crop inset/)
  await assert.rejects(build([], 'merge-pdf'), /at least one/)
  await assert.rejects(build([items[0]], 'edit-pdf'), /Enter text/)
  for (const operation of ['page-numbers', 'watermark-pdf', 'edit-pdf']) assert.equal((await build([items[0]], operation, { ...initialSettings, text: 'Review' })).getPageCount(), 1)
  const imageDoc = await PDFDocument.create(), page = imageDoc.addPage([300, 400]);page.setRotation(degrees(90))
  await assert.rejects(buildPdf([await imageDoc.save()], [items[0]], 'edit-pdf', { ...initialSettings, text: 'Test' }), /unrotated/)
  const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64'))
  const mark = { id: 'signature-1', pageId: 'page-1', x: 20, y: 30, width: 25, height: 10 }
  for (const [angle, expected] of [[0, '1 0 0 1 60 240 cm'], [90, '1 0 0 1 120 80 cm'], [180, '1 0 0 1 240 160 cm'], [270, '1 0 0 1 180 320 cm']]) {
    const source = await PDFDocument.create(), page = source.addPage([300, 400]); page.setRotation(degrees(angle))
    const signed = await PDFDocument.load(await buildPdf([await source.save()], [{ ...items[0], id: 'page-1' }], 'sign-pdf', initialSettings, png, [mark]))
    const contents = signed.getPage(0).node.Contents()
    const commands = Array.from({ length: contents.size() }, (_, i) => decodePDFRawStream(signed.context.lookup(contents.get(i))).decode()).map(bytes => Buffer.from(bytes).toString()).join('\n')
    assert.ok(commands.includes(expected), `Signature coordinates must match preview at rotation ${angle}: ${commands}`)
  }
  await assert.rejects(buildPdf([bytes], [{ ...items[0], id: 'page-1' }], 'sign-pdf', initialSettings, png, [{ ...mark, x: 99 }]), /inside its page/)
  assert.deepEqual(splitGroups('1-2;3;1,3', 3), [[1, 2], [3], [1, 3]])
  assert.deepEqual(splitGroups('', 3), [[1], [2], [3]])
  for (const value of ['0', '4', '3-1', 'x', '1;']) assert.throws(() => splitGroups(value, 3))
  const formDoc = await PDFDocument.create(), formPage = formDoc.addPage(), form = formDoc.getForm()
  form.createTextField('Name').addToPage(formPage);form.createCheckBox('Agree').addToPage(formPage)
  const formBytes = await formDoc.save(), fields = await inspectForm(formBytes)
  fields.find(f => f.name === 'Name').value = 'Ada';fields.find(f => f.name === 'Agree').value = 'true'
  const filled = await PDFDocument.load(await fillForm(formBytes, fields, false))
  assert.equal(filled.getForm().getTextField('Name').getText(), 'Ada');assert.equal(filled.getForm().getCheckBox('Agree').isChecked(), true)
  assert.equal((await PDFDocument.load(await fillForm(formBytes, fields, true))).getForm().getFields().length, 0)
  assert.equal((await PDFDocument.load(await buildPdf([formBytes], [items[0]], 'merge-pdf', initialSettings))).getForm().getFields().length, 0)
  const catalogSource = await readFile(new URL('../src/converters/pdf-tools/catalog.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(catalogSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  const { pdfTools, pdfMenuLinks } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
  const hub = await readFile(new URL('../dist/tools/index.html', import.meta.url), 'utf8'), sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8')
  for (const tool of pdfTools) {
    const html = await readFile(new URL(`../dist/${tool.slug}/index.html`, import.meta.url), 'utf8')
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.ok(html.includes(`href="https://bloomollo.dpdns.org/${tool.slug}/"`));assert.ok(sitemap.includes(`/${tool.slug}/`));assert.ok(hub.includes(`href="/${tool.slug}/"`))
  }
  for (const link of pdfMenuLinks) await readFile(new URL(`../dist${link.href}index.html`, import.meta.url), 'utf8')
  console.log('PASS: merge/order/extract/remove primitives, rotation, crop validation, overlays, form fill/flatten, split groups, all PDF tool routes, menu destinations, metadata and sitemap.')
} finally { await unlink(temp) }