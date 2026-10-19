export type PageItem = { id: string; file: number; index: number; rotation: number; selected: boolean; thumbnail: string; width: number; height: number }
export type SignaturePlacement = { id: string; pageId: string; x: number; y: number; width: number; height: number }
export type TextBox = SignaturePlacement & { text: string; fontSize: number; family: 'sans' | 'serif' | 'mono'; bold: boolean; italic: boolean; color: string; align: 'left' | 'center' | 'right' }
export async function textFonts() {
  const { PDFDocument, StandardFonts } = await import('pdf-lib')
  const pdf = await PDFDocument.create()
  const names = [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique, StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic, StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique]
  return Promise.all(names.map(name => pdf.embedFont(name)))
}
export function textFontIndex(box: TextBox) { return (box.family === 'serif' ? 4 : box.family === 'mono' ? 8 : 0) + (box.bold ? 1 : 0) + (box.italic ? 2 : 0) }
export function textBoxLines(box: TextBox, width: number, height: number, measure: (text: string) => number) {
  const lines: string[] = []
  for (const paragraph of box.text.replace(/\r/g, '').split('\n')) {
    let line = ''
    for (const char of paragraph) {
      if (measure(char) > width) throw new Error('Text box is too narrow for its font size. Widen it or reduce the font size.')
      if (line && measure(line + char) > width) { lines.push(line); line = '' }
      line += char
    }
    lines.push(line)
  }
  if (lines.length * box.fontSize * 1.2 > height + .01) throw new Error('Text overflows its box. Increase the box height or reduce the font size.')
  return lines.map((text, index) => ({ text, width: measure(text), y: box.fontSize + index * box.fontSize * 1.2 }))
}
export type FormValue = { name: string; kind: 'text' | 'check' | 'choice' | 'unsupported'; value: string; options: string[]; readonly: boolean; max?: number }
export type Settings = { text: string; fontSize: number; start: number; crop: number; x: number; y: number; width: number; height: number; opacity: number; flatten: boolean; numberPosition?: boolean }
export const initialSettings: Settings = { text: '', fontSize: 18, start: 1, crop: 24, x: 10, y: 10, width: 30, height: 12, opacity: .25, flatten: false }
export async function inspectForm(bytes: Uint8Array): Promise<FormValue[]> {
  const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFOptionList, PDFRadioGroup } = await import('pdf-lib')
  const pdf = await PDFDocument.load(bytes)
  if (pdf.getForm().hasXFA()) throw new Error('XFA forms are not supported. Use an AcroForm PDF.')
  return pdf.getForm().getFields().map(field => ({ name: field.getName(), readonly: field.isReadOnly(),
    kind: field instanceof PDFTextField ? 'text' : field instanceof PDFCheckBox ? 'check' : field instanceof PDFDropdown || field instanceof PDFOptionList || field instanceof PDFRadioGroup ? 'choice' : 'unsupported',
    value: field instanceof PDFTextField ? field.getText() ?? '' : field instanceof PDFCheckBox ? String(field.isChecked()) : field instanceof PDFRadioGroup ? field.getSelected() ?? '' : field instanceof PDFDropdown || field instanceof PDFOptionList ? field.getSelected()[0] ?? '' : '',
    options: field instanceof PDFDropdown || field instanceof PDFOptionList || field instanceof PDFRadioGroup ? field.getOptions() : [], max: field instanceof PDFTextField ? field.getMaxLength() : undefined }))
}
export async function fillForm(bytes: Uint8Array, values: FormValue[], flatten: boolean) {
  const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFOptionList, PDFRadioGroup } = await import('pdf-lib')
  const pdf = await PDFDocument.load(bytes), form = pdf.getForm()
  for (const value of values) {
    if (value.readonly) continue
    const field = form.getField(value.name)
    if (field instanceof PDFTextField) field.setText(value.value)
    else if (field instanceof PDFCheckBox) { if (value.value === 'true') field.check(); else field.uncheck() }
    else if (field instanceof PDFDropdown || field instanceof PDFOptionList) { if (value.value) field.select(value.value); else field.clear() }
    else if (field instanceof PDFRadioGroup) { if (value.value) field.select(value.value); else field.clear() }
  }
  if (flatten) form.flatten()
  return new Uint8Array(await pdf.save())
}
export async function buildPdf(files: Uint8Array[], items: PageItem[], operation: string, settings: Settings, signature?: Uint8Array, placements?: SignaturePlacement[], textBoxes?: TextBox[]) {
  const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib')
  const sources = await Promise.all(files.map(bytes => PDFDocument.load(bytes))), output = await PDFDocument.create()
  for (const source of sources) { if (source.getForm().getFields().length) source.getForm().flatten() }
  if (!items.length) throw new Error('Keep at least one page in the output.')
  const font = await output.embedFont(StandardFonts.Helvetica)
  const image = signature ? await output.embedPng(signature) : null
  const fonts = new Map<number, Awaited<ReturnType<typeof output.embedFont>>>()
  for (const [position, item] of items.entries()) {
    const [page] = await output.copyPages(sources[item.file], [item.index]); output.addPage(page)
    page.setRotation(degrees(((page.getRotation().angle + item.rotation) % 360 + 360) % 360))
    const box = page.getCropBox(), width = box.width, height = box.height
    if (!item.selected) continue
    if (operation === 'crop-pdf') {
      if (settings.crop < 0 || settings.crop * 2 >= Math.min(width, height)) throw new Error('Crop inset must be smaller than half the page dimensions.')
      page.setCropBox(box.x + settings.crop, box.y + settings.crop, width - settings.crop * 2, height - settings.crop * 2)
    }
    if (['page-numbers', 'watermark-pdf', 'edit-pdf', ...(!placements ? ['sign-pdf'] : [])].includes(operation) && page.getRotation().angle !== 0) throw new Error('Overlay tools currently require unrotated pages. Use Rotate PDF to normalize this document first.')
    if (operation === 'page-numbers') {
      const text = String(settings.start + position), size = Math.min(settings.fontSize, height / 10)
      page.drawText(text, { x: box.x + (settings.numberPosition ? width * settings.x / 100 : (width - font.widthOfTextAtSize(text, size)) / 2), y: box.y + (settings.numberPosition ? height * (1 - settings.y / 100) - size : 16), font, size, color: rgb(.12, .18, .24) })
    }
    if (operation === 'edit-pdf' && textBoxes) {
      for (const mark of textBoxes.filter(mark => mark.pageId === item.id && mark.text.trim())) {
        if (![mark.x, mark.y, mark.width, mark.height, mark.fontSize].every(Number.isFinite) || mark.x < 0 || mark.y < 0 || mark.width <= 0 || mark.height <= 0 || mark.x + mark.width > 100.001 || mark.y + mark.height > 100.001 || mark.fontSize < 6 || mark.fontSize > 144 || !/^#[0-9a-f]{6}$/i.test(mark.color)) throw new Error('Invalid text box. Keep boxes inside the page and use a font size from 6 to 144.')
        const names = [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique, StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic, StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique]
        const key = textFontIndex(mark)
        if (!fonts.has(key)) fonts.set(key, await output.embedFont(names[key]))
        const face = fonts.get(key)!, w = width * mark.width / 100, h = height * mark.height / 100
        const color = rgb(parseInt(mark.color.slice(1, 3), 16) / 255, parseInt(mark.color.slice(3, 5), 16) / 255, parseInt(mark.color.slice(5, 7), 16) / 255)
        for (const line of textBoxLines(mark, w, h, text => face.widthOfTextAtSize(text, mark.fontSize))) {
          const offset = mark.align === 'center' ? (w - line.width) / 2 : mark.align === 'right' ? w - line.width : 0
          page.drawText(line.text, { x: box.x + width * mark.x / 100 + offset, y: box.y + height * (1 - mark.y / 100) - line.y, font: face, size: mark.fontSize, color })
        }
      }
    }
    if (operation === 'watermark-pdf' || (operation === 'edit-pdf' && !textBoxes)) {
      if (!settings.text.trim()) throw new Error('Enter text before creating the PDF.')
      const size = settings.fontSize
      page.drawText(settings.text, { x: box.x + width * settings.x / 100, y: box.y + height * (1 - settings.y / 100) - size, font, size, maxWidth: width * (1 - settings.x / 100), color: rgb(.08, .12, .18), opacity: operation === 'watermark-pdf' ? settings.opacity : 1 })
    }
    if (operation === 'sign-pdf') {
      if (!image) throw new Error('Draw or upload a signature first.')
      if (placements) {
        for (const mark of placements.filter(mark => mark.pageId === item.id)) {
          if (![mark.x, mark.y, mark.width, mark.height].every(Number.isFinite) || mark.x < 0 || mark.y < 0 || mark.width <= 0 || mark.height <= 0 || mark.x + mark.width > 100.001 || mark.y + mark.height > 100.001) throw new Error('Keep each signature inside its page.')
          const angle = ((page.getRotation().angle % 360) + 360) % 360
          const vw = angle % 180 ? height : width, vh = angle % 180 ? width : height
          const left = vw * mark.x / 100, top = vh * mark.y / 100, w = vw * mark.width / 100, h = vh * mark.height / 100
          const [x, y] = angle === 90 ? [top + h, left] : angle === 180 ? [width - left, top + h] : angle === 270 ? [width - top - h, height - left] : [left, height - top - h]
          page.drawImage(image, { x: box.x + x, y: box.y + y, width: w, height: h, rotate: degrees(angle) })
        }
        continue
      }
      const w = width * settings.width / 100, h = Math.min(height * settings.height / 100, w * image.height / image.width)
      page.drawImage(image, { x: box.x + width * settings.x / 100, y: box.y + height * (1 - settings.y / 100) - h, width: w, height: h })
    }
  }
  return new Uint8Array(await output.save())
}
export function splitGroups(input: string, count: number): number[][] {
  if (!input.trim()) return Array.from({ length: count }, (_, i) => [i + 1])
  return input.split(';').map(group => {
    const result = new Set<number>()
    for (const token of group.split(',')) {
      const match = token.trim().match(/^(\d+)(?:-(\d+))?$/)
      if (!match) throw new Error('Separate groups with semicolons, for example 1-3;4-6;7,9.')
      const start = Number(match[1]), end = Number(match[2] ?? match[1])
      if (start < 1 || end > count || end < start) throw new Error(`Choose pages from 1 to ${count}.`)
      for (let n = start; n <= end; n++) result.add(n)
    }
    return [...result]
  })
}