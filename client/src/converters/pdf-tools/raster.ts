import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Settings } from './engine'
export async function renderPage(doc: PDFDocumentProxy, number: number, targetWidth: number) {
  const page = await doc.getPage(number), base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: Math.min(targetWidth / base.width, 2) })
  if (viewport.width * viewport.height > 16_000_000 || Math.max(viewport.width, viewport.height) > 16000) throw new Error('Page exceeds safe rendering limits.')
  const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
  await page.render({ canvas, viewport, background: '#fff' }).promise
  return { canvas, width: base.width, height: base.height }
}
export async function rasterPdf(doc: PDFDocumentProxy, selected: Set<number>, redact: boolean, settings: Settings, resolution: number, progress: (n: number) => void, cancelled: () => boolean) {
  const { PDFDocument } = await import('pdf-lib')
  const output = await PDFDocument.create()
  for (let n = 1; n <= doc.numPages; n++) {
    if (cancelled()) throw new Error('Export cancelled. No partial file was downloaded.')
    progress(n)
    const original = await doc.getPage(n), base = original.getViewport({ scale: resolution / 72 })
    const { canvas, width, height } = await renderPage(doc, n, base.width)
    try {
      if (redact && selected.has(n - 1)) {
        const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#000'
        ctx.fillRect(Math.floor(canvas.width * settings.x / 100), Math.floor(canvas.height * settings.y / 100), Math.ceil(canvas.width * settings.width / 100), Math.ceil(canvas.height * settings.height / 100))
      }
      const data = canvas.toDataURL(redact ? 'image/png' : 'image/jpeg', .7)
      const image = redact ? await output.embedPng(data) : await output.embedJpg(data)
      const page = output.addPage([width, height]); page.drawImage(image, { x: 0, y: 0, width, height })
      if (output.getPageCount() > 100) throw new Error('Limit exceeded.')
    } finally { canvas.width = 0; canvas.height = 0 }
  }
  const bytes = new Uint8Array(await output.save())
  if (bytes.length > 150 * 1024 * 1024) throw new Error('Output exceeds 150 MB. Use a smaller document.')
  return bytes
}