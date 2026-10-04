import { useEffect, useRef, useState } from 'react'
import WipeButton from '../../components/ui/WipeButton'
import BrandWordmark from '../../components/BrandWordmark'
import { checkImageDimensions, defaults, detectImage, MAX_BYTES, MAX_FILES, MAX_PIXELS, moveItem } from './model'
import type { ImageItem, PdfSettings } from './model'
import './image-to-pdf.css'

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [settings, setSettings] = useState<PdfSettings>(defaults)
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([]), [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null)
  const [over, setOver] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const input = useRef<HTMLInputElement>(null), worker = useRef<Worker | null>(null)
  const urls = useRef(new Set<string>()), dragged = useRef<number | null>(null), importing = useRef(false), mounted = useRef(true)
  useEffect(() => { mounted.current = true; const pool = urls.current; return () => { mounted.current = false; worker.current?.terminate(); pool.forEach(url => URL.revokeObjectURL(url)); pool.clear() } }, [])
  useEffect(() => {
    if (!images.length && !busy) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [images.length, busy])
  const locked = loading || busy
  function invalidate() { if (result) { URL.revokeObjectURL(result.url); urls.current.delete(result.url); setResult(null) } }
  async function addFiles(files: File[]) {
    if (importing.current || busy) return
    if (!files.length) return
    if (typeof createImageBitmap !== 'function') {
      setErrors(['This browser cannot decode images locally. Please use a current version of Chrome, Edge, Firefox or Safari.'])
      return
    }
    importing.current = true; setLoading(true); setErrors([]); invalidate()
    const accepted: ImageItem[] = [], problems: string[] = []
    let bytes = images.reduce((sum, image) => sum + image.file.size, 0)
    for (const file of files) {
      if (!mounted.current) break
      try {
        if (images.length + accepted.length >= MAX_FILES) throw new Error('Maximum 60 images per PDF.')
        if (file.size > 25 * 1024 * 1024) throw new Error('Maximum 25 MB per image.')
        if (bytes + file.size > MAX_BYTES) throw new Error('Maximum 150 MB of images per batch.')
        await detectImage(file)
        await checkImageDimensions(file)
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
        try {
          if (bitmap.width * bitmap.height > MAX_PIXELS) throw new Error('Maximum 40 megapixels per image.')
          const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height))
          const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
          canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Cannot create preview.')), 'image/png'))
          if (!mounted.current) break
          const url = URL.createObjectURL(blob); urls.current.add(url)
          accepted.push({ id: crypto.randomUUID(), file, url, width: bitmap.width, height: bitmap.height, rotation: 0 }); bytes += file.size
        } finally { bitmap.close() }
      } catch (error) { problems.push(`${file.name}: ${error instanceof Error ? error.message : 'Cannot decode this image. It may be damaged or unsupported by your browser.'}`) }
    }
    if (mounted.current) { setImages(previous => [...previous, ...accepted]); setErrors(problems); setLoading(false) }
    importing.current = false
  }
  function reorder(from: number, to: number) { if (!locked && images[from] && to >= 0 && to < images.length && from !== to) { invalidate(); setImages(previous => moveItem(previous, from, to)); setAnnouncement(`Moved ${images[from].file.name} to page ${to + 1}.`) } }
  function change<K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) { invalidate(); setSettings(previous => ({ ...previous, [key]: value })) }
  function remove(id: string) { invalidate(); const item = images.find(image => image.id === id); if (item) { URL.revokeObjectURL(item.url); urls.current.delete(item.url) }; setImages(previous => previous.filter(image => image.id !== id)) }
  function cancel() { worker.current?.terminate(); worker.current = null; setBusy(false); setProgress(0); setAnnouncement('Conversion stopped. Your images and settings are unchanged.') }
  function convert() {
    if (!images.length || locked) return
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      setErrors(['Local PDF conversion is unavailable in this browser. Please use a current browser with Web Workers and OffscreenCanvas support.'])
      return
    }
    invalidate(); setErrors([]); setBusy(true); setProgress(0)
    try {
      const task = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' }); worker.current = task
      task.onmessage = event => {
        const data = event.data
        if (data.type === 'progress') setProgress(data.done)
        if (data.type === 'complete') {
          const blob = new Blob([data.bytes], { type: 'application/pdf' }), url = URL.createObjectURL(blob); urls.current.add(url)
          setResult({ url, size: blob.size, name: (settings.name.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 80) || 'bloomollo-images') + '.pdf' }); setBusy(false); task.terminate(); worker.current = null
        }
        if (data.type === 'error') { setErrors([data.message]); setBusy(false); task.terminate(); worker.current = null }
      }
      task.onerror = () => { setErrors(['Your browser could not process these images. Try the latest Chrome, Edge or Firefox, or a smaller batch.']); cancel() }
      task.postMessage({ images: images.map(({ file, rotation }) => ({ file, rotation })), settings })
    } catch { setErrors(['Conversion could not start. This tool needs a browser with Web Workers and OffscreenCanvas.']); cancel() }
  }
  return <div className="pdf-tool">
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    <header className="pdf-toolbar"><a href="/" className="pdf-brand" aria-label="Bloomollo home"><svg className="pdf-brand-mark" width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 2 12 7v14l-12 7L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.3" /><path d="m4 9 12 7 12-7M16 16v14m-6-17 12-7m-12 7v14" stroke="currentColor" strokeWidth="1.3" /></svg><BrandWordmark className="pdf-brand-name" /></a><span className="pdf-toolbar-divider" aria-hidden="true" /><h1 className="pdf-tool-title">Image <span className="pdf-title-to">to</span> <span className="pdf-title-badge">PDF</span></h1><span className="pdf-local"><i /> Files stay on your device</span></header>
    <div className="pdf-workspace">
      <section className="pdf-image-panel" aria-label="Images to convert">
        <div className="pdf-panel-heading"><h2>{images.length ? `Images (${images.length})` : 'Images'}</h2>{images.length > 0 && <button className="pdf-text-button" disabled={locked} onClick={() => { images.forEach(image => { URL.revokeObjectURL(image.url); urls.current.delete(image.url) }); setImages([]); invalidate(); setErrors([]) }}>Clear all</button>}</div>
        <input ref={input} id="pdf-files" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif" hidden disabled={locked} onChange={event => { void addFiles(Array.from(event.target.files || [])); event.target.value = '' }} />
        <div className={`pdf-drop ${images.length ? 'compact' : ''} ${over ? 'drag-over' : ''}`} onDragOver={event => { event.preventDefault(); if (!locked && dragged.current === null) setOver(true) }} onDragLeave={() => setOver(false)} onDrop={event => { event.preventDefault(); setOver(false); if (dragged.current === null) void addFiles(Array.from(event.dataTransfer.files)) }}>
          {!images.length && <><div className="pdf-file-art" aria-hidden="true"><span>JPG</span><span>PNG</span><span>PDF</span></div><h3>Drop your images here</h3><p>Or choose files from your device</p></>}
          <WipeButton disabled={locked} onClick={() => input.current?.click()}>{loading ? 'Reading images…' : images.length ? '+ Add more images' : '+ Choose images'}</WipeButton>
          {!images.length && <small>JPG, PNG, WebP, GIF, BMP, AVIF<br />Up to 60 images · 25 MB per file · 150 MB total</small>}
        </div>
        {images.length > 0 && <><p className="pdf-order-help">Drag to reorder, or use the arrow buttons. Numbers match PDF page order.</p><ol className="pdf-image-grid">{images.map((image, index) => <li key={image.id} draggable={!locked} onDragStart={event => { dragged.current = index; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)) }} onDragEnd={() => { dragged.current = null }} onDragOver={event => { if (dragged.current !== null) event.preventDefault() }} onDrop={event => { if (dragged.current !== null) { event.preventDefault(); event.stopPropagation(); reorder(dragged.current, index); dragged.current = null } }}>
          <div className="pdf-thumb"><span className="pdf-page-number">{index + 1}</span><img src={image.url} alt={image.file.name} style={{ transform: `rotate(${image.rotation}deg)` }} /><button className="pdf-remove" disabled={locked} aria-label={`Remove ${image.file.name}`} onClick={() => remove(image.id)}>×</button></div>
          <div className="pdf-image-info"><strong title={image.file.name}>{image.file.name}</strong><span>{image.width} × {image.height}</span></div>
          <div className="pdf-image-actions"><button disabled={locked || index === 0} aria-label={`Move ${image.file.name} earlier`} onClick={() => reorder(index, index - 1)}>←</button><button disabled={locked} aria-label={`Rotate ${image.file.name}`} onClick={() => { invalidate(); setImages(previous => previous.map(item => item.id === image.id ? { ...item, rotation: (item.rotation + 90) % 360 } : item)) }}>↻ Rotate</button><button disabled={locked || index === images.length - 1} aria-label={`Move ${image.file.name} later`} onClick={() => reorder(index, index + 1)}>→</button></div>
        </li>)}</ol></>}
        {errors.length > 0 && <div className="pdf-errors" role="alert"><strong>Some files need attention</strong><ul>{errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>}
      </section>
      <aside className="pdf-settings" aria-label="PDF controls">
        <div className="pdf-options-scroll"><details className="pdf-options"><summary>PDF settings <span aria-hidden="true">+</span></summary>
        <fieldset disabled={locked}><legend className="sr-only">PDF settings</legend>
          <label>Image quality<select value={settings.quality} onChange={event => change('quality', event.target.value as PdfSettings['quality'])}><option value="high">High — more detail</option><option value="balanced">Balanced — recommended</option><option value="small">Compact — smaller file</option></select></label>
          <p className="pdf-setting-note">Images keep their proportions and are never cropped. Transparency becomes white. High quality is not lossless.</p>
          <label>File name<div className="pdf-filename"><input maxLength={80} value={settings.name} onChange={event => change('name', event.target.value)} placeholder="bloomollo-images" /><span>.pdf</span></div></label>
        </fieldset>
        </details>
        <aside className="pdf-sponsor" aria-label="Sponsor advertisement space"><span>SPONSOR</span><div>Advertisement space</div><small>Your images are never shared.</small></aside>
        <fieldset className="pdf-quick-settings" disabled={locked}><legend>Quick settings</legend>
          <label>Page size<select value={settings.size} onChange={event => change('size', event.target.value as PdfSettings['size'])}><option value="a4">A4</option><option value="letter">US Letter</option><option value="image">Fit to image</option></select></label>
          <label>Orientation<select disabled={settings.size === 'image' || locked} value={settings.orientation} onChange={event => change('orientation', event.target.value as PdfSettings['orientation'])}><option value="auto">Automatic</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
          <label>Margins<select value={settings.margin} onChange={event => change('margin', Number(event.target.value))}><option value="0">None</option><option value="18">Small</option><option value="36">Comfortable</option></select></label>
        </fieldset></div>
        <div className="pdf-export"><div className="pdf-export-summary"><span>Ready to create</span><strong>{images.length} page{images.length === 1 ? '' : 's'}</strong></div>{busy ? <><progress value={progress} max={images.length} /><p role="status">Processing {progress} of {images.length} images…</p><button className="pdf-secondary" onClick={cancel}>Cancel conversion</button></> : result ? <div className="pdf-success" role="status"><strong>Your PDF is ready</strong><p>{(result.size / 1024 / 1024).toFixed(2)} MB · Saved only when you download</p><a className="pdf-primary" href={result.url} download={result.name}>Download PDF ↓</a><button className="pdf-text-button" onClick={convert}>Create again</button></div> : <button className="pdf-primary" disabled={!images.length || locked} onClick={convert}>Download PDF <span>→</span></button>}<p className="pdf-export-note">No uploads. No watermarks. No account.</p></div>
      </aside>
    </div>
  </div>
}