import { renderToString } from 'react-dom/server'
import App from './App'
import { brand, homeDescription, products } from './data'
import { getLocale, localizedRoutes, localeMetadata } from './converters/image-to-pdf/locales'
import { formatPages, getFormatPage } from './converters/image-to-pdf/format-pages'
import { taskGuides, getTaskGuide } from './converters/image-to-pdf/task-guides'

export const routes = [...taskGuides.map(guide => `/guides/${guide.slug}/`), ...localizedRoutes, '/', ...products.map(p => `/extensions/${p.slug}/`), '/tools/image-to-pdf/', ...formatPages.map(page => '/tools/' + page.slug + '/'), '/privacy/', '/terms/', '/404/']
export function render(pathname: string) {
  const locale = getLocale(pathname)
  const localized = locale === "en" ? null : localeMetadata[locale]
  const formatPage = getFormatPage(pathname)
  const taskGuide = getTaskGuide(pathname)
  const product = products.find(p => pathname === `/extensions/${p.slug}/`)
  const title = localized ? localized.title : formatPage ? formatPage.title : pathname === '/tools/image-to-pdf/' ? `Image to PDF & JPG to PDF Converter — Free | ${brand}` : product ? `${product.name} — ${product.line} | ${brand}` : pathname === '/privacy/' ? `Privacy Policy | ${brand}` : pathname === '/terms/' ? `Terms of Service | ${brand}` : pathname === '/404/' ? `Page not found | ${brand}` : `${brand} - A small upgrade. A better everyday.`
  const description = localized ? localized.description : formatPage ? formatPage.description : pathname === '/tools/image-to-pdf/' ? 'Convert JPG, PNG and WebP images to one PDF free, without uploading files. Reorder photos, adjust pages and download. No watermark or account.' : product ? product.description : homeDescription
  const schema = product ? {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: product.name,
    description: product.line, applicationCategory: 'BrowserApplication', operatingSystem: 'Chrome',
    softwareVersion: product.version, ...(product.storeUrl ? { downloadUrl: product.storeUrl } : {}),
  } : (pathname === '/tools/image-to-pdf/' || formatPage || localized) ? {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: formatPage ? 'Bloomollo ' + formatPage.label + ' to PDF' : 'Bloomollo Image to PDF',
    description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web browser',
    inLanguage: locale,
    browserRequirements: 'Requires a modern browser with Web Workers and OffscreenCanvas',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  } : null
  return { html: renderToString(<App pathname={pathname} />), title: taskGuide ? `${taskGuide.title} | ${brand}` : title, description: taskGuide?.description ?? description, schema, locale }
}