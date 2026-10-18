export const localTools = [
  { slug: 'pdf-to-jpg', name: 'PDF to JPG', from: 'PDF', to: 'JPG', description: 'Turn PDF pages into JPG images on your device. Choose pages, resolution and quality, then download images or a ZIP.' },
  { slug: 'html-to-pdf', name: 'HTML to PDF', from: 'HTML', to: 'PDF', description: 'Preview a local HTML document safely and use your browser’s Save as PDF. No uploads, scripts or remote resources.' },
] as const
export function getLocalTool(path: string) { return localTools.find(tool => path.replace(/\/+$/, '') === '/' + tool.slug) }