import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { mkdir, writeFile } from 'node:fs/promises'
const targets = await (await fetch('http://127.0.0.1:9333/json')).json()
const ws = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map(), errors = []
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data)
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params)
  if (data.id) { const callbacks = pending.get(data.id); pending.delete(data.id); data.error ? callbacks.reject(data.error) : callbacks.resolve(data.result) }
})
const send = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); ws.send(JSON.stringify({ id: key, method, params })) })
async function evaluate(expression) { const data = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails)); return data.result.value }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function wait(expression) { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100) } throw new Error(`Timeout: ${expression}`) }
await send('Runtime.enable'); await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'http://127.0.0.1:4173/tools/image-to-pdf/' })
await wait('!!document.querySelector("#pdf-files")'); await sleep(500)
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight'), true, 'desktop fits viewport')
assert.equal(await evaluate('!!document.querySelector(".site-header")'), false, 'no full site navigation')
assert.equal(await evaluate('document.querySelector(".pdf-options").open'), false, 'settings collapsed initially')
assert.equal(await evaluate('!!document.querySelector(".pdf-tool-footer")'), false, 'page footer removed')
for (const [width, height] of [[1440, 900], [1536, 729]]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await sleep(200)
  assert.equal(await evaluate('document.querySelector(".pdf-options-scroll").scrollHeight <= document.querySelector(".pdf-options-scroll").clientHeight'), true, `collapsed sidebar fits without scrolling at ${width}x${height}`)
}
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
assert.ok(await evaluate('!!document.querySelector(".pdf-sponsor")'), 'sponsor slot exists')
assert.equal(await evaluate('document.querySelectorAll(".pdf-quick-settings select").length'), 3, 'three quick settings visible')
assert.equal(await evaluate('Math.round(document.querySelector(".pdf-settings").getBoundingClientRect().width)'), 368, 'wider desktop sidebar')
await evaluate('document.querySelector(".pdf-options summary").click()')
assert.equal(await evaluate('document.querySelector(".pdf-options").open'), true)
assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight'), true, 'expanded settings fit viewport')
await evaluate('document.querySelector(".pdf-options summary").click()')
assert.equal(await evaluate('getComputedStyle(document.querySelector(".pdf-tool")).backgroundColor'), 'rgb(246, 248, 251)')
await evaluate(`(async () => {
  const dt = new DataTransfer();
  for (const [name,w,h,color] of [['wide.png',400,200,'red'],['tall.png',200,400,'blue']]) {
    const c = document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.fillStyle=color; ctx.fillRect(0,0,w,h);
    const blob = await new Promise(resolve => c.toBlob(resolve,'image/png')); dt.items.add(new File([blob],name,{type:'image/png'}));
  }
  dt.items.add(new File(['not an image'],'invalid.heic',{type:'image/heic'}));
  const input=document.querySelector('#pdf-files'); input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true}));
})()`)
await wait('document.querySelectorAll(".pdf-image-grid li").length === 2 && !document.querySelector("fieldset").disabled')
assert.match(await evaluate('document.querySelector(".pdf-errors").textContent'), /Unsupported format/)
await evaluate('document.querySelectorAll(".pdf-image-actions button")[2].click()'); await sleep(100)
assert.equal(await evaluate('document.querySelector(".pdf-image-info strong").textContent'), 'tall.png')
await evaluate('document.querySelector(".pdf-export > button").click()')
await wait('!!document.querySelector("a[download]")')
const encoded = await evaluate(`(async()=>{const b=new Uint8Array(await (await fetch(document.querySelector('a[download]').href)).arrayBuffer());let text='';for(const n of b)text+=String.fromCharCode(n);return btoa(text)})()`)
const pdf = await PDFDocument.load(Buffer.from(encoded, 'base64'))
assert.equal(pdf.getPageCount(), 2)
assert.ok(pdf.getPage(0).getHeight() > pdf.getPage(0).getWidth(), 'reordered portrait first')
assert.ok(pdf.getPage(1).getWidth() > pdf.getPage(1).getHeight(), 'landscape second')
await evaluate('document.querySelectorAll(".pdf-image-actions button")[1].click()'); await sleep(100)
assert.equal(await evaluate('!!document.querySelector("a[download]")'), false, 'editing invalidates stale download')
await evaluate('document.querySelector(".pdf-export > button").click()'); await wait('!!document.querySelector("a[download]")')
const rotated = await evaluate(`(async()=>{const b=new Uint8Array(await (await fetch(document.querySelector('a[download]').href)).arrayBuffer());let text='';for(const n of b)text+=String.fromCharCode(n);return btoa(text)})()`)
assert.ok((await PDFDocument.load(Buffer.from(rotated, 'base64'))).getPage(0).getWidth() > 700, 'rotation changes auto orientation')
await mkdir(new URL('../checks/', import.meta.url), { recursive: true })
const desktop = await send('Page.captureScreenshot', { format: 'png' })
await writeFile(new URL('../checks/pdf-desktop.png', import.meta.url), Buffer.from(desktop.data, 'base64'))
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight'), true, 'mobile fits viewport')
await evaluate('document.querySelector(".pdf-options summary").click()')
assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight'), true, 'mobile expanded settings fit viewport')
await evaluate('document.querySelector(".pdf-options summary").click()')
const mobile = await send('Page.captureScreenshot', { format: 'png' })
await writeFile(new URL('../checks/pdf-mobile.png', import.meta.url), Buffer.from(mobile.data, 'base64'))
assert.equal(errors.length, 0, JSON.stringify(errors))
ws.close()
console.log('PASS: local import, unsupported format reporting, reordering, rotation, valid downloadable PDF, stale-result invalidation, desktop/mobile layout, no runtime exceptions.')