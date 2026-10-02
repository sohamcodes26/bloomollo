import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const targets = await (await fetch('http://127.0.0.1:9333/json')).json()
const target = targets.find(t => t.type === 'page')
assert.ok(target, 'Start Chromium with remote debugging on port 9333')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map(), errors = []
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  if (message.id) {
    const task = pending.get(message.id)
    pending.delete(message.id)
    if (task) message.error ? task.reject(message.error) : task.resolve(message.result)
  }
})
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params }))
})
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
  return result.result.value
}
async function navigate(path = '/') {
  await send('Page.navigate', { url: `http://127.0.0.1:4173${path}` }); await sleep(900)
}
const output = new URL('../checks/', import.meta.url)
await mkdir(output, { recursive: true })
async function screenshot(name) {
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(new URL(name, output), Buffer.from(shot.data, 'base64'))
}
await send('Runtime.enable'); await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
await navigate()
await evaluate('localStorage.removeItem("bloomollo-theme")')
await navigate()
assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light')
await evaluate('document.querySelector(".theme-toggle").click()')
await navigate()
assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark')
await evaluate('document.querySelector(".theme-toggle").click()')
await sleep(600)
assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light')
assert.equal(await evaluate('localStorage.getItem("bloomollo-theme")'), 'light')
assert.equal(await evaluate('getComputedStyle(document.querySelector(".cybernetic-eyes")).mixBlendMode'), 'multiply')
assert.equal(await evaluate('getComputedStyle(document.querySelector(".cybernetic-eyes canvas")).filter'), 'none')
assert.equal(await evaluate('getComputedStyle(document.documentElement).backgroundColor'), 'rgb(255, 255, 255)')
assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero-actions .button.light")).backgroundColor'), 'rgb(0, 87, 232)')
await screenshot('light-hero-desktop.png')
await evaluate('document.querySelector("#extensions").scrollIntoView({behavior:"instant"})'); await sleep(1000)
await screenshot('light-collection-desktop.png')
// Check real text colors on their resolved surfaces, including nested preview labels.
const failures = await evaluate(`(() => {
  const luminance = rgb => rgb.map(v => {v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4}).reduce((a,v,i) => a + v * [.2126,.7152,.0722][i],0);
  const parse = color => color.match(/[\\d.]+/g).map(Number);
  return [...document.querySelectorAll('p,small,.card-meta,.card-footnote,.preview-note,.window-top,.draft-label,.speed-caption,.sound-volume small,.code-line,.filter-row button,.eyebrow,.section-kicker')].filter(el => el.getBoundingClientRect().width && el.textContent.trim()).flatMap(el => {
    const fg = luminance(parse(getComputedStyle(el).color).slice(0,3));
    let node = el, bg = [255,255,255];
    while(node) { const c = parse(getComputedStyle(node).backgroundColor); if(c.length === 3 || c[3] === 1) {bg = c.slice(0,3); break} node = node.parentElement }
    const b = luminance(bg), ratio = (Math.max(fg,b) + .05) / (Math.min(fg,b) + .05);
    return ratio < 4.5 ? [{text:el.textContent.trim(),ratio}] : [];
  });
})()`)
assert.deepEqual(failures, [], `Light text contrast: ${JSON.stringify(failures)}`)
for (const slug of ['debug2ai','draft-rescue','page-capture','page-ink','video-speed-booster','sound-booster']) {
  await navigate(`/extensions/${slug}/`)
  assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light')
  assert.equal(await evaluate('document.querySelector(".theme-toggle").getAttribute("aria-pressed")'), 'true')
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".preview-window")).backgroundColor'), 'rgb(255, 255, 255)')
}
await screenshot('light-product-desktop.png')
await send('Page.reload'); await sleep(900)
assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await navigate()
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
assert.equal(await evaluate('document.querySelector(".theme-toggle").getBoundingClientRect().width > 0'), true)
await screenshot('light-hero-mobile.png')
await evaluate('document.querySelector(".menu-toggle").click()'); await sleep(300)
assert.equal(await evaluate('getComputedStyle(document.querySelector(".mobile-nav")).color'), 'rgb(25, 27, 32)')
await evaluate('document.querySelector(".theme-toggle").click()')
assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark')
assert.equal(await evaluate('getComputedStyle(document.querySelector(".cybernetic-eyes")).mixBlendMode'), 'screen')
assert.equal(errors.length, 0, JSON.stringify(errors))
console.log('PASS: saved light/dark switching, six light product routes, reload persistence, text contrast, themed previews/eyes, desktop/mobile layout, mobile menu, and no runtime exceptions.')
ws.close()