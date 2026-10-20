export const pdfTools = [
  { slug: 'merge-pdf', name: 'Merge PDF', group: 'Organize PDF', mark: '↗', description: 'Combine PDF files. Arrange individual pages before downloading one document.' },
  { slug: 'split-pdf', name: 'Split PDF', group: 'Organize PDF', mark: 'Ⅱ', description: 'Split a PDF into individual pages or custom page ranges, downloaded as a ZIP.' },
  { slug: 'remove-pages', name: 'Remove pages', group: 'Organize PDF', mark: '−', description: 'Select the pages to remove and save a new copy of your PDF.' },
  { slug: 'extract-pages', name: 'Extract pages', group: 'Organize PDF', mark: '↗', description: 'Choose pages and export them together as a new PDF.' },
  { slug: 'organize-pdf', name: 'Organize PDF', group: 'Organize PDF', mark: '↔', description: 'Reorder, rotate and remove PDF pages with a visual page workspace.' },
  { slug: 'compress-pdf', name: 'Compress PDF', group: 'Optimize PDF', mark: '↓', description: 'Create an image-based PDF at a lower resolution. Size reduction is not guaranteed; searchable text is lost.' },
  { slug: 'rotate-pdf', name: 'Rotate PDF', group: 'Edit PDF', mark: '↻', description: 'Rotate selected PDF pages in 90-degree steps and download a new copy.' },
  { slug: 'page-numbers', name: 'Add page numbers', group: 'Edit PDF', mark: '#', description: 'Add sequential page numbers to the bottom of selected PDF pages.' },
  { slug: 'watermark-pdf', name: 'Add watermark', group: 'Edit PDF', mark: 'W', description: 'Add text or image watermarks with formatting, positioning, transparency, rotation and page-range controls.' },
  { slug: 'crop-pdf', name: 'Crop PDF', group: 'Edit PDF', mark: '⌗', description: 'Trim page edges using a crop box. Hidden content is not deleted; do not use cropping to redact.' },
  { slug: 'edit-pdf', name: 'Add text to PDF', group: 'Edit PDF', mark: 'T', description: 'Place new text on selected pages. This does not edit or replace existing text.' },
  { slug: 'pdf-forms', name: 'PDF Forms', group: 'Edit PDF', mark: '☑', description: 'Fill supported existing PDF form fields, then save or flatten the completed form.' },
  { slug: 'sign-pdf', name: 'Sign PDF', group: 'PDF Security', mark: 'S', description: 'Place a drawn signature or signature image on selected pages. Not a certificate-based digital signature.' },
  { slug: 'redact-pdf', name: 'Redact PDF', group: 'PDF Security', mark: '■', description: 'Black out a rectangular area and rebuild every page as an image. Original text, links, forms and metadata are discarded.' },
  { slug: 'compare-pdf', name: 'Compare PDF', group: 'PDF Security', mark: 'Ⅱ', description: 'Review two PDF documents side by side. Visual comparison only, without automatic difference detection.' },
  { slug: 'pdf-to-markdown', name: 'PDF to Markdown', group: 'PDF Intelligence', mark: 'M', description: 'Extract selectable text into a page-separated Markdown file. No OCR, table reconstruction or inferred headings.' },
] as const
export type PdfTool = typeof pdfTools[number]
export type ToolSlug = PdfTool['slug']
export function getPdfTool(path: string) { return pdfTools.find(tool => path.replace(/\/+$/, '') === '/' + tool.slug) }
export const pdfMenuGroups = ['Organize PDF', 'Optimize PDF', 'Convert to PDF', 'Convert from PDF', 'Edit PDF', 'PDF Security', 'PDF Intelligence']
export const pdfMenuLinks = [
  ...pdfTools.map(tool => ({ ...tool, href: `/${tool.slug}/` })),
  { name: 'JPG to PDF', href: '/tools/jpg-to-pdf/', group: 'Convert to PDF', mark: '+' },
  { name: 'Image to PDF', href: '/image-to-pdf/', group: 'Convert to PDF', mark: '+' },
  { name: 'Scan to PDF', href: '/scan-to-pdf/', group: 'Organize PDF', mark: '▣' },
  { name: 'HTML to PDF', href: '/html-to-pdf/', group: 'Convert to PDF', mark: '<>' },
  { name: 'PDF to JPG', href: '/pdf-to-jpg/', group: 'Convert from PDF', mark: '▧' },
]
