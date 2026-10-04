import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/converters/image-to-pdf/model.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { defaults, moveItem, pageLayout, detectImage, checkImageDimensions } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
assert.deepEqual(moveItem(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a'])
assert.deepEqual(moveItem(['a', 'b'], -1, 1), ['a', 'b'])
assert.deepEqual(moveItem(['a', 'b'], 1, 0), ['b', 'a'])
for (const size of ['a4', 'letter', 'image']) {
  for (const orientation of ['auto', 'portrait', 'landscape']) {
    const layout = pageLayout(1200, 800, { ...defaults, size, orientation })
    assert.ok(layout.width > 0 && layout.height > 0)
    assert.ok(Math.abs(layout.width / layout.height - 1.5) < .001)
    assert.ok(layout.x >= 0 && layout.y >= 0)
  }
}
assert.throws(() => pageLayout(0, 10, defaults), /Invalid/)
assert.ok(pageLayout(800, 1200, defaults).ph > pageLayout(800, 1200, defaults).pw)
assert.ok(pageLayout(1200, 800, defaults).pw > pageLayout(1200, 800, defaults).ph)
assert.equal(await detectImage(new File([new Uint8Array([255, 216, 255])], 'wrong.txt')), 'JPEG')
await assert.rejects(detectImage(new File(['bad'], 'fake.png')), /Unsupported/)
const png = new Uint8Array(24)
png.set([137, 80, 78, 71]); const view = new DataView(png.buffer)
view.setUint32(16, 10000); view.setUint32(20, 10000)
await assert.rejects(checkImageDimensions(new File([png], 'oversized.png')), /40 megapixels/)
console.log('PASS: immutable reordering, page geometry, aspect ratios, orientation, content detection, invalid inputs, and oversized PNG protection.')