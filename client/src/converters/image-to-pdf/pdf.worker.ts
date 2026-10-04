import { PDFDocument } from 'pdf-lib'
import { MAX_PIXELS, pageLayout } from './model'
import type { PdfSettings } from './model'
const scope = self as unknown as { postMessage: (message: unknown, transfer?: Transferable[]) => void }

self.onmessage = async (event: MessageEvent<{ images: { file: File; rotation: number }[]; settings: PdfSettings }>) => {
  try {
    const { images, settings } = event.data
    const pdf = await PDFDocument.create()
    pdf.setCreator('Bloomollo'); pdf.setTitle(settings.name || 'Images to PDF')
    for (let i = 0; i < images.length; i++) {
      const { file, rotation } = images[i]
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      try {
        if (bitmap.width * bitmap.height > MAX_PIXELS) throw new Error(`${file.name}: exceeds the 40 megapixel limit.`)
        const sideways = rotation % 180 !== 0
        const originalW = sideways ? bitmap.height : bitmap.width, originalH = sideways ? bitmap.width : bitmap.height
        const limit = settings.quality === 'small' ? 1600 : settings.quality === 'balanced' ? 2600 : 5000
        const scale = Math.min(1, limit / Math.max(originalW, originalH))
        const w = Math.max(1, Math.round(originalW * scale)), h = Math.max(1, Math.round(originalH * scale))
        const canvas = new OffscreenCanvas(w, h), ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Image processing is unavailable in this browser.')
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h)
        ctx.translate(w / 2, h / 2); ctx.rotate(rotation * Math.PI / 180)
        ctx.drawImage(bitmap, -bitmap.width * scale / 2, -bitmap.height * scale / 2, bitmap.width * scale, bitmap.height * scale)
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: settings.quality === 'high' ? .95 : settings.quality === 'balanced' ? .85 : .7 })
        const image = await pdf.embedJpg(await blob.arrayBuffer())
        const layout = pageLayout(originalW, originalH, settings)
        pdf.addPage([layout.pw, layout.ph]).drawImage(image, layout)
        self.postMessage({ type: 'progress', done: i + 1, total: images.length })
      } finally { bitmap.close() }
    }
    const bytes = await pdf.save()
    scope.postMessage({ type: 'complete', bytes }, [bytes.buffer as ArrayBuffer])
  } catch (error) { self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Conversion failed. Try fewer or smaller images.' }) }
}