import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const deadline = setTimeout(() => { console.error('Browser layout check timed out'); process.exit(1) }, 60000)
deadline.unref()
const targets = await (await fetch(`http://127.0.0.1:${process.env.BROWSER_DEBUG_PORT || 9333}/json`, { signal: AbortSignal.timeout(10000) })).json()
const target = targets.find(item => item.type === 'page' && item.url.startsWith('http://127.0.0.1:4173')) || targets.find(item => item.type === 'page')
assert.ok(target, 'A debug browser page must be available')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data)
  if (!data.id) return
  const callback = pending.get(data.id)
  pending.delete(data.id)
  data.error ? callback.reject(data.error) : callback.resolve(data.result)
})
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const key = ++id
  pending.set(key, { resolve, reject })
  ws.send(JSON.stringify({ id: key, method, params }))
})
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true })
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
try {
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/image-to-pdf/' })
  for (let i = 0; i < 50 && !await evaluate('!!document.querySelector(".pdf-options")'); i++) await sleep(100)
  await mkdir(new URL('../checks/', import.meta.url), { recursive: true })
  for (const [width, height] of [[1366, 768], [1536, 729], [1280, 720], [1440, 900], [1280, 650]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    await sleep(200)
    await evaluate('document.querySelector(".pdf-options").open = true')
    await sleep(100)
    const layout = await evaluate(`(() => {
      const options = document.querySelector('.pdf-options-scroll'), button = document.querySelector('.pdf-export .pdf-primary');
      return { scroll: options.scrollHeight > options.clientHeight + 1, bottom: button.getBoundingClientRect().bottom, quickBottom: document.querySelector('.pdf-quick-settings').getBoundingClientRect().bottom, optionsBottom: options.getBoundingClientRect().bottom, horizontal: document.documentElement.scrollWidth > innerWidth };
    })()`)
    assert.equal(layout.scroll, false, `${width}x${height}: expanded settings should not need an inner scrollbar`)
    assert.ok(layout.bottom <= height, `${width}x${height}: download stays visible`)
    assert.ok(layout.quickBottom <= layout.optionsBottom + 1, `${width}x${height}: quick controls stay visible`)
    assert.equal(layout.horizontal, false)
    const screenshot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(new URL(`../checks/settings-${width}x${height}.png`, import.meta.url), Buffer.from(screenshot.data, 'base64'))
    await evaluate('document.querySelector(".pdf-options").open = false')
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await sleep(250)
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".pdf-drawer-trigger")).display'), 'flex')
  await evaluate('document.querySelector(".pdf-drawer-trigger").click()')
  await sleep(500)
  assert.equal(await evaluate('document.querySelector("#pdf-settings-drawer").getAttribute("aria-modal")'), 'true')
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".pdf-sponsor")).flexDirection'), 'column', 'mobile sponsor unchanged')
  await evaluate('document.querySelector(".pdf-drawer-done").click()')
  console.log('PASS: expanded laptop settings without inner scrollbars at five viewport sizes; visible export and quick controls; mobile drawer unchanged.')
} finally {
  clearTimeout(deadline)
  ws.close()
}