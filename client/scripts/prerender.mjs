import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { productionOrigin } from '../site.config.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { render, routes } = await import('../.ssr/entry-server.js')
const template = await readFile(path.join(root, 'dist/index.html'), 'utf8')
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const origin = new URL(process.env.SITE_URL || productionOrigin)
if (!['http:', 'https:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('SITE_URL must be an http(s) origin without a path or credentials')
const siteUrl = origin.origin
const verification = process.env.GOOGLE_SITE_VERIFICATION?.trim()
const verificationFile = process.env.GOOGLE_SITE_VERIFICATION_FILE?.trim()
if (verificationFile && !/^google[a-zA-Z0-9_-]+\.html$/.test(verificationFile)) throw new Error('GOOGLE_SITE_VERIFICATION_FILE must be the exact googleTOKEN.html filename from Search Console')
for (const route of routes) {
  const { html, title, description, schema: pageSchema, locale } = render(route)
  const schema = route === '/' ? {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', '@id': siteUrl + '/#website', name: 'Bloomollo', alternateName: 'bloomollo.dpdns.org', url: siteUrl + '/', description, publisher: { '@id': siteUrl + '/#organization' } },
      { '@type': 'Organization', '@id': siteUrl + '/#organization', name: 'Bloomollo', url: siteUrl + '/', logo: { '@type': 'ImageObject', url: siteUrl + '/apple-touch-icon.png', width: 180, height: 180 } },
    ],
  } : pageSchema ? { ...pageSchema, ...(pageSchema['@type'] === 'WebApplication' ? { url: siteUrl + route, '@id': siteUrl + route + '#application', publisher: { '@type': 'Organization', name: 'Bloomollo', url: siteUrl + '/' }, featureList: ['Combine images into one PDF', 'Local file processing', 'Reorder and rotate images', 'A4, US Letter and fit-to-image pages', 'No watermark or account'], isAccessibleForFree: true } : {}) } : null
  const canonical = siteUrl && route !== '/404/' ? `<link rel="canonical" href="${escape(siteUrl + route)}"/><meta property="og:url" content="${escape(siteUrl + route)}"/>` : ''
  const metadata = `<meta name="description" content="${escape(description)}"/><meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary"/><meta name="twitter:title" content="${escape(title)}"/><meta name="twitter:description" content="${escape(description)}"/>${canonical}${route === '/404/' ? '<meta name="robots" content="noindex"/>' : ''}${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>` : ''}`
  const extra = `<meta property="og:site_name" content="Bloomollo"/>${route !== '/404/' ? '<meta name="robots" content="index,follow,max-image-preview:large"/>' : ''}${verification ? `<meta name="google-site-verification" content="${escape(verification)}"/>` : ''}`
  const localizedConverter = route === '/tools/image-to-pdf/' || /^\/(hi|de|fr|es)\/tools\//.test(route)
  const alternates = localizedConverter ? ['en', 'hi', 'de', 'fr', 'es', 'x-default'].map(code => '<link rel="alternate" hreflang="' + code + '" href="' + siteUrl + (code === 'en' || code === 'x-default' ? '' : '/' + code) + '/tools/image-to-pdf/"/>').join('') : ''
  const output = template.replace(/<html lang="en"/, '<html lang="' + locale + '"').replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`).replace('<!--page-meta-->', metadata + extra + alternates).replace('<div id="root"></div>', `<div id="root">${html}</div>`)
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
if (verificationFile) await writeFile(path.join(root, 'dist', verificationFile), `google-site-verification: ${verificationFile}`)
console.log(`Prerendered ${routes.length} pages with full HTML content.`)