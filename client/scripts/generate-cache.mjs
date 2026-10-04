import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
async function collect(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(file))
    else if (entry.name !== 'sw.js') files.push(file)
  }
  return files
}
const files = (await collect(dist)).sort()
const hash = createHash('sha256')
for (const file of files) hash.update(path.relative(dist, file)).update(await readFile(file))
const version = hash.digest('hex').slice(0, 16)
const urls = files.filter(file => /\.(?:js|css|png|jpg|jpeg|webp|avif|svg|woff2|ico)$/i.test(file))
  .map(file => '/' + path.relative(dist, file).split(path.sep).join('/'))
await writeFile(path.join(dist, 'sw.js'), `
const CACHE = 'bloomollo-assets-${version}';
const ASSETS = ${JSON.stringify(urls)};
// PDF processing is optional: cache its engine on first use, not on every visit.
const PRECACHE = ASSETS.filter(url => !/\/pdf\.worker-/.test(url));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('bloomollo-assets-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || event.request.mode === 'navigate' || !ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
  }));
});
`)
console.log(`Generated versioned asset cache: ${urls.length} assets (${version}). HTML stays network-fresh.`)