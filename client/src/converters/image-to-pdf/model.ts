export interface ImageItem { id: string; file: File; url: string; width: number; height: number; rotation: number }
export interface PdfSettings { size: 'a4' | 'letter' | 'image'; orientation: 'auto' | 'portrait' | 'landscape'; margin: number; quality: 'high' | 'balanced' | 'small'; name: string }
export const defaults: PdfSettings = { size: 'a4', orientation: 'auto', margin: 18, quality: 'balanced', name: 'bloomollo-images' }
export const MAX_FILES = 60
export const MAX_BYTES = 150 * 1024 * 1024
export const MAX_PIXELS = 40_000_000
// Inspect common image headers before allocating a full decoded bitmap.
export async function checkImageDimensions(file: File): Promise<void> {
  const bytes = new Uint8Array(await file.slice(0, 262144).arrayBuffer())
  const view = new DataView(bytes.buffer)
  let width = 0, height = 0
  if (bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    width = view.getUint32(16); height = view.getUint32(20)
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 255) break
      while (bytes[offset] === 255) offset++
      const marker = bytes[offset++]
      if (marker === 218 || marker === 217) break
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue
      if (offset + 2 > bytes.length) break
      const length = view.getUint16(offset)
      if (length < 2 || offset + length > bytes.length) break
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 8) {
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break
      }
      offset += length
    }
  }
  if (width * height > MAX_PIXELS) throw new Error('Maximum 40 megapixels per image.')
}
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items
  const result = [...items]; const [item] = result.splice(from, 1); result.splice(to, 0, item); return result
}
export async function detectImage(file: File): Promise<string> {
  const b = new Uint8Array(await file.slice(0, 64).arrayBuffer())
  const text = new TextDecoder().decode(b)
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'JPEG'
  if (b[0] === 137 && text.slice(1, 4) === 'PNG') return 'PNG'
  if (text.startsWith('GIF87a') || text.startsWith('GIF89a')) return 'GIF'
  if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') return 'WebP'
  if (text.startsWith('BM')) return 'BMP'
  if (text.slice(4, 8) === 'ftyp' && /avif|avis/.test(text.slice(8))) return 'AVIF'
  throw new Error('Unsupported format. Use JPG, PNG, WebP, GIF, BMP or AVIF. HEIC, TIFF and SVG are not supported yet.')
}
export function pageLayout(width: number, height: number, settings: PdfSettings) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Invalid image dimensions.')
  let [pw, ph] = settings.size === 'letter' ? [612, 792] : settings.size === 'image' ? [width * .75 + settings.margin * 2, height * .75 + settings.margin * 2] : [595.28, 841.89]
  // Keep unusually wide/tall images inside ordinary PDF viewer page limits.
  const pageScale = Math.min(1, 14400 / Math.max(pw, ph))
  pw *= pageScale; ph *= pageScale
  if (settings.size !== 'image' && (settings.orientation === 'landscape' || (settings.orientation === 'auto' && width > height))) [pw, ph] = [ph, pw]
  const scale = Math.min((pw - settings.margin * 2) / width, (ph - settings.margin * 2) / height)
  return { pw, ph, width: width * scale, height: height * scale, x: (pw - width * scale) / 2, y: (ph - height * scale) / 2 }
}