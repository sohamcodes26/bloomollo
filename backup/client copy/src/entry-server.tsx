import { renderToString } from 'react-dom/server'
import App from './App'
import { brand, homeDescription, products } from './data'

export const routes = ['/', ...products.map(p => `/extensions/${p.slug}/`), '/privacy/', '/404/']
export function render(pathname: string) {
  const product = products.find(p => pathname === `/extensions/${p.slug}/`)
  const title = product ? `${product.name} — ${product.line} | ${brand}` : pathname === '/privacy/' ? `Privacy & transparency | ${brand}` : pathname === '/404/' ? `Page not found | ${brand}` : `${brand} — Small Chrome extensions. A better everyday.`
  const description = product ? product.description : homeDescription
  const schema = product ? {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: product.name,
    description: product.line, applicationCategory: 'BrowserApplication', operatingSystem: 'Chrome',
    softwareVersion: product.version, ...(product.storeUrl ? { downloadUrl: product.storeUrl } : {}),
  } : null
  return { html: renderToString(<App pathname={pathname} />), title, description, schema }
}