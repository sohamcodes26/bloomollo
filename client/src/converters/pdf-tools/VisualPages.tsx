import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { buildPdf, fillForm } from './engine'
import type { FormValue, PageItem, Settings, WatermarkOptions } from './engine'
import { renderPage } from './raster'

type Props = {
  page: PageItem; index: number; doc: PDFDocumentProxy; bytes: Uint8Array
  operation: string; settings: Settings; fields: FormValue[]; busy: boolean; watermark?: WatermarkOptions
  onSettings: (settings: Settings) => void
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export default function VisualPage({ page, index, doc, bytes, operation, settings, fields, busy, watermark, onSettings }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false), [image, setImage] = useState(page.thumbnail)
  const [error, setError] = useState(''), [rendering, setRendering] = useState(false)
  const [renderedKey, setRenderedKey] = useState('')
  const previewKey = JSON.stringify([settings, fields, page.selected, watermark])
  const gesture = useRef<{ x: number; y: number; settings: Settings; resize: boolean; width: number; height: number } | null>(null)
  const watermarkMode = operation === 'watermark-pdf' && !!watermark
  const watermarkApplies = watermarkMode && page.index + 1 >= watermark.pageStart && page.index + 1 <= watermark.pageEnd
  const textTool = ['edit-pdf', 'page-numbers'].includes(operation)
  const number = operation === 'page-numbers'
  const text = number ? String(settings.start + index) : watermarkMode ? watermark.text : settings.text
  const fontSize = number ? Math.min(settings.fontSize, page.height / 10) : watermarkMode ? watermark.fontSize : settings.fontSize
  const x = number && !settings.numberPosition ? (100 - text.length * fontSize * .556 / page.width * 100) / 2 : settings.x
  const y = number && !settings.numberPosition ? 100 - (16 + fontSize) / page.height * 100 : settings.y
  const width = operation === 'redact-pdf' || watermarkMode ? settings.width : Math.min(100 - x, Math.max(8, text.length * fontSize * .6 / page.width * 100))
  const height = operation === 'redact-pdf' || watermarkMode ? settings.height : Math.min(100 - y, Math.max(2, fontSize * 1.5 * Math.max(1, text.split('\n').length) / page.height * 100))
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries.some(e => e.isIntersecting)), { rootMargin: '500px' })
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!visible) return
    let disposed = false
    let preview: PDFDocumentProxy | undefined
    const timer = setTimeout(() => {
      setRendering(true)
      void (async () => {
        const { loadPdf } = await import('../local-tools/pdf-engine')
        let source = doc, pageNumber = page.index + 1
        if (operation === 'pdf-forms') {
          preview = await loadPdf(await fillForm(bytes, fields, false), '').promise
          source = preview
        } else if ((textTool && page.selected || watermarkApplies) && (text.trim() || number || watermarkApplies)) {
          const output = await buildPdf([bytes], [{ ...page, file: 0 }], operation, { ...settings, start: settings.start + index }, undefined, undefined, undefined, watermark)
          preview = await loadPdf(output, '').promise
          source = preview; pageNumber = 1
        }
        if (disposed) return
        const { canvas } = await renderPage(source, pageNumber, 1600)
        if (!disposed) { setImage(canvas.toDataURL('image/png')); setRenderedKey(previewKey); setError('') }
        canvas.width = 0; canvas.height = 0
      })().catch(cause => { if (!disposed) { setError(cause instanceof Error ? cause.message : 'Preview failed.'); setRenderedKey(previewKey) } }).finally(() => {
        if (!disposed) setRendering(false)
        if (preview) void preview.loadingTask.destroy()
      })
    }, 220)
    return () => { disposed = true; clearTimeout(timer) }
  }, [visible, doc, bytes, page, operation, settings, fields, textTool, text, number, index, previewKey, watermark, watermarkApplies])
  function begin(event: PointerEvent<HTMLElement>, resize = false) {
    if (busy || event.button !== 0) return
    event.preventDefault(); event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const rect = host.current!.getBoundingClientRect()
    gesture.current = { x: event.clientX, y: event.clientY, settings: { ...settings, x, y }, resize, width: rect.width, height: rect.height }
  }
  function move(event: PointerEvent<HTMLElement>) {
    const g = gesture.current
    if (!g) return
    const dx = (event.clientX - g.x) / g.width * 100, dy = (event.clientY - g.y) / g.height * 100
    onSettings(g.resize ? { ...g.settings, width: clamp(g.settings.width + dx, 1, 100 - g.settings.x), height: clamp(g.settings.height + dy, 1, 100 - g.settings.y) } : {
      ...g.settings, x: clamp(g.settings.x + dx, 0, 100 - width), y: clamp(g.settings.y + dy, 0, 100 - height), ...(number ? { numberPosition: true } : {}),
    })
  }
  return <div className="visual-page-container">
    <div ref={host} className="visual-sheet" style={{ aspectRatio: `${page.width}/${page.height}` }} aria-busy={rendering || renderedKey !== previewKey}>
      <img src={image} alt={`Document page ${index + 1}`} draggable={false} />
      {page.selected && (textTool || operation === 'redact-pdf') && <div className={`visual-handle${operation === 'redact-pdf' ? ' visual-redaction' : ''}${watermarkMode ? ' visual-watermark' : ''}`} role="button" tabIndex={busy ? -1 : 0} aria-disabled={busy} aria-label={`Move ${operation === 'redact-pdf' ? 'redaction' : 'text'} on page ${index + 1}`} style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%`, opacity: watermarkMode ? watermark.opacity : undefined, transform: watermarkMode ? `rotate(${watermark.rotation}deg)` : undefined }} onPointerDown={event => begin(event)} onPointerMove={move} onPointerUp={() => { gesture.current = null }} onPointerCancel={() => { gesture.current = null }} onKeyDown={event => {
        if (busy || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
        event.preventDefault(); const step = event.shiftKey ? 2 : .25
        onSettings({ ...settings, x: clamp(x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), 0, 100 - width), y: clamp(y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0), 0, 100 - height), ...(number ? { numberPosition: true } : {}) })
       }}>{!text && textTool && <span className="visual-placeholder">Enter text, then drag here</span>}{operation === 'redact-pdf' && <button className="visual-resize" disabled={busy} aria-label="Resize redaction" onPointerDown={event => begin(event, true)} onPointerMove={move} onPointerUp={() => { gesture.current = null }} onPointerCancel={() => { gesture.current = null }} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
        event.stopPropagation(); event.preventDefault()
        onSettings({ ...settings, width: clamp(settings.width + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0), 1, 100 - x), height: clamp(settings.height + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0), 1, 100 - y) })
      }}>↘</button>}</div>}
      {page.selected && operation === 'crop-pdf' && <div className="tool-crop" style={{ inset: `${settings.crop / page.height * 100}% ${settings.crop / page.width * 100}%` }} />}
    </div>{error && <p className="local-error" role="alert">{error}</p>}
  </div>
}
