import { renderToString } from 'react-dom/server'
import App from './App'
import { brand, homeDescription, products } from './data'

export const routes = ['/', ...products.map(p => `/extensions/${p.slug}/`), '/tools/image-to-pdf/', '/privacy/', '/terms/', '/404/']
export function render(pathname: string) {
  const product = products.find(p => pathname === `/extensions/${p.slug}/`)
  const title = pathname === '/tools/image-to-pdf/' ? `Image to PDF — Convert images locally | ${brand}` : product ? `${product.name} — ${product.line} | ${brand}` : pathname === '/privacy/' ? `Privacy Policy | ${brand}` : pathname === '/terms/' ? `Terms of Service | ${brand}` : pathname === '/404/' ? `Page not found | ${brand}` : `${brand} — Small Chrome extensions. A better everyday.`
  const description = pathname === '/tools/image-to-pdf/' ? 'Convert JPG, PNG, WebP and other supported images to PDF on your device. Reorder, rotate, choose page settings and download. No uploads or account.' : product ? product.description : homeDescription
  const schema = product ? {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: product.name,
    description: product.line, applicationCategory: 'BrowserApplication', operatingSystem: 'Chrome',
    softwareVersion: product.version, ...(product.storeUrl ? { downloadUrl: product.storeUrl } : {}),
  } : pathname === '/tools/image-to-pdf/' ? {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Bloomollo Image to PDF',
    description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web browser',
    browserRequirements: 'Requires a modern browser with Web Workers and OffscreenCanvas',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  } : null
  return { html: renderToString(<App pathname={pathname} />), title, description, schema }
}