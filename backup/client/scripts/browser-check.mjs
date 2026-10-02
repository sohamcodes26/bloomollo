import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const targets = await (await fetch('http://127.0.0.1:9333/json')).json()
const target = targets.find(t => t.type === 'page')
if (!target) throw new Error('Start a Chromium browser with --remote-debugging-port=9333 first.')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args)
  if (message.id) {
    const callback = pending.get(message.id)
    if (callback) { pending.delete(message.id); message.error ? callback.reject(message.error) : callback.resolve(message.result) }
  }
})
function send(method, params = {}) {
  return new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })) })
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
await send('Runtime.enable'); await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'http://127.0.0.1:4173/' }); await sleep(1600)
assert.equal(await evaluate('document.querySelectorAll(".product-card").length'), 6)
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
assert.equal(await evaluate('document.fonts.check("14px Manrope")'), true)
await evaluate('document.querySelector("#extensions").scrollIntoView({behavior:"instant"})'); await sleep(1000)
await evaluate('[...document.querySelectorAll(".filter-row button")].find(b=>b.textContent==="Media").click()'); await sleep(350)
assert.equal(await evaluate('document.querySelectorAll(".product-card").length'), 2)
await evaluate('document.querySelector(".filter-row button").click()'); await sleep(1000)
const output = new URL('../checks/', import.meta.url)
await mkdir(output, { recursive: true })
async function screenshot(name) {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await writeFile(new URL(name, output), Buffer.from(shot.data, 'base64'))
}
await screenshot('collection-desktop.png')
await evaluate('scrollTo({top:0,behavior:"instant"})'); await sleep(500)
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 200, y: 300 }); await sleep(400)
const cubeBefore = await evaluate('document.querySelector(".cube").style.transform')
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1200, y: 400 }); await sleep(400)
assert.notEqual(await evaluate('document.querySelector(".cube").style.transform'), cubeBefore)
await screenshot('hero-desktop.png')
await evaluate('document.querySelector(".globe-section").scrollIntoView({behavior:"instant"})'); await sleep(800)
const canvasBounds = await evaluate('(()=>{const b=document.querySelector("canvas").getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()')
const globeBefore = await evaluate('document.querySelector("canvas").toDataURL()')
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...canvasBounds }); await sleep(400)
await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...canvasBounds })
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: canvasBounds.x + 80, y: canvasBounds.y + 10, button: 'left', buttons: 1 })
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: canvasBounds.x + 80, y: canvasBounds.y + 10, button: 'left', clickCount: 1 })
await sleep(300)
assert.notEqual(await evaluate('document.querySelector("canvas").toDataURL()'), globeBefore)
await evaluate('document.querySelector(".globe-controls button").click()')
assert.equal(await evaluate('document.querySelector(".globe-controls button").getAttribute("aria-pressed")'), 'true')
await screenshot('globe-desktop.png')
for (const slug of ['debug2ai', 'draft-rescue', 'page-capture', 'page-ink', 'video-speed-booster', 'sound-booster']) {
  await send('Page.navigate', { url: `http://127.0.0.1:4173/extensions/${slug}/` }); await sleep(550)
  assert.equal(await evaluate('document.querySelectorAll("h1").length'), 1)
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  assert.equal(await evaluate('document.querySelectorAll(".store-pending button:disabled").length'), 2)
}
await screenshot('product-desktop.png')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await send('Page.navigate', { url: 'http://127.0.0.1:4173/' }); await sleep(1000)
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
await screenshot('hero-mobile.png')
await evaluate('document.querySelector(".menu-toggle").click()'); await sleep(400)
assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'), 'true')
await evaluate('document.querySelector(".mobile-nav a").click()'); await sleep(1000)
assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'), 'false')
await screenshot('collection-mobile.png')
await evaluate('document.querySelector("#faq").scrollIntoView({behavior:"instant"});document.querySelector(".faq-list summary").click()'); await sleep(350)
assert.equal(await evaluate('document.querySelector(".faq-list details").open'), true)
await send('Page.navigate', { url: 'http://127.0.0.1:4173/extensions/draft-rescue/' }); await sleep(750)
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
await screenshot('product-mobile.png')
assert.equal(errors.length, 0, `Browser errors: ${JSON.stringify(errors)}`)
console.log('PASS: desktop/mobile layout, hydrated category filters, cube pointer response, globe drawing/drag/pause, six detail routes, disabled install state, mobile menu, FAQs, fonts, and no browser/hydration errors.')
ws.close()