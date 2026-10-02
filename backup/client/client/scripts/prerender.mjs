import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { render, routes } = await import('../.ssr/entry-server.js')
const template = await readFile(path.join(root, 'dist/index.html'), 'utf8')
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const siteUrl = process.env.SITE_URL?.replace(/\/$/, '')
if (siteUrl && !/^https?:\/\//.test(siteUrl)) throw new Error('SITE_URL must be a full http(s) URL')
for (const route of routes) {
  const { html, title, description, schema } = render(route)
  const canonical = siteUrl && route !== '/404/' ? `<link rel="canonical" href="${escape(siteUrl + route)}"/><meta property="og:url" content="${escape(siteUrl + route)}"/>` : ''
  const metadata = `<meta name="description" content="${escape(description)}"/><meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary"/><meta name="twitter:title" content="${escape(title)}"/><meta name="twitter:description" content="${escape(description)}"/>${canonical}${route === '/404/' ? '<meta name="robots" content="noindex"/>' : ''}${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>` : ''}`
  const output = template.replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`).replace('<!--page-meta-->', metadata).replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  const directory = route === '/' ? path.join(root, 'dist') : path.join(root, 'dist', route.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'index.html'), output)
  if (route === '/404/') await writeFile(path.join(root, 'dist/404.html'), output)
}
if (siteUrl) {
  await writeFile(path.join(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.filter(r => r !== '/404/').map(route => `<url><loc>${escape(siteUrl + route)}</loc></url>`).join('')}</urlset>`)
  await writeFile(path.join(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)
} else {
  await writeFile(path.join(root, 'dist/robots.txt'), 'User-agent: *\nAllow: /\n')
  console.log('SITE_URL not set: canonical URLs and sitemap intentionally omitted. Set your real domain before deployment.')
}
await rm(path.join(root, '.ssr'), { recursive: true, force: true })
console.log(`Prerendered ${routes.length} pages with full HTML content.`)