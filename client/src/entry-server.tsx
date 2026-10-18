import { renderToString } from 'react-dom/server'
import App from './App'
import { brand, homeDescription, products } from './data'
import { getLocale, localizedRoutes, localeMetadata } from './converters/image-to-pdf/locales'
import { formatPages, getFormatPage } from './converters/image-to-pdf/format-pages'
import { taskGuides, getTaskGuide } from './converters/image-to-pdf/task-guides'
import { localTools, getLocalTool } from './converters/local-tools/catalog'
import { pdfTools, getPdfTool } from './converters/pdf-tools/catalog'

export const routes = ['/scan-to-pdf/', ...pdfTools.map(tool => `/${tool.slug}/`), ...localTools.map(tool => `/${tool.slug}/`), ...taskGuides.map(guide => `/guides/${guide.slug}/`), ...localizedRoutes, '/', ...products.map(p => `/extensions/${p.slug}/`), '/tools/', '/image-to-pdf/', ...formatPages.map(page => '/tools/' + page.slug + '/'), '/privacy/', '/terms/', '/404/']
export function render(pathname: string) {
  const locale = getLocale(pathname)
  const localized = locale === "en" ? null : localeMetadata[locale]
  const formatPage = getFormatPage(pathname)
  const taskGuide = getTaskGuide(pathname)
  const product = products.find(p => pathname === `/extensions/${p.slug}/`)
  const title = pathname === '/tools/' ? 'Free PDF Tools — Merge, Split, Edit & Convert | Bloomollo' : localized ? localized.title : formatPage ? formatPage.title : pathname === '/image-to-pdf/' ? `Image to PDF & JPG to PDF Converter — Free | ${brand}` : product ? `${product.name} — ${product.line} | ${brand}` : pathname === '/privacy/' ? `Privacy Policy | ${brand}` : pathname === '/terms/' ? `Terms of Service | ${brand}` : pathname === '/404/' ? `Page not found | ${brand}` : `${brand} - A small upgrade. A better everyday.`
  const description = pathname === '/tools/' ? 'Merge, split, organize, rotate and convert PDFs locally. Add watermarks, fill forms, export images and more with free browser tools. No file uploads or accounts.' : localized ? localized.description : formatPage ? formatPage.description : pathname === '/image-to-pdf/' ? 'Convert JPG, PNG and WebP images to one PDF free, without uploading files. Reorder photos, adjust pages and download. No watermark or account.' : product ? product.description : homeDescription
  const schema = product ? {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: product.name,
    description: product.line, applicationCategory: 'BrowserApplication', operatingSystem: 'Chrome',
    softwareVersion: product.version, ...(product.storeUrl ? { downloadUrl: product.storeUrl } : {}),
  } : (pathname === '/image-to-pdf/' || formatPage || localized) ? {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: formatPage ? 'Bloomollo ' + formatPage.label + ' to PDF' : 'Bloomollo Image to PDF',
    description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web browser',
    inLanguage: locale,
    browserRequirements: 'Requires a modern browser with Web Workers and OffscreenCanvas',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  } : null
  const tool = getLocalTool(pathname) ?? getPdfTool(pathname) ?? (pathname === '/scan-to-pdf/' ? { name: 'Scan to PDF', description: 'Combine photos of scanned pages into a PDF locally. Upload images or capture a photo on a supported mobile device. No OCR or automatic edge detection.' } : null)
  return { html: renderToString(<App pathname={pathname} />), title: tool ? `${tool.name} — Free Local Tool | ${brand}` : taskGuide ? `${taskGuide.title} | ${brand}` : title, description: tool?.description ?? taskGuide?.description ?? description, schema, locale }
}