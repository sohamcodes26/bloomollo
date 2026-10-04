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
  const [over, setOver] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null), [dropIndex, setDropIndex] = useState<number | null>(null)
  const dropTarget = useRef<number | null>(null)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; width: number } | null>(null)
  const dragSlots = useRef<DOMRect[]>([])
  const dragScroll = useRef(0)
  const pendingDrag = useRef<{ timer: number; x: number; y: number } | null>(null)
  const grid = useRef<HTMLOListElement>(null)
  const [mobile, setMobile] = useState(false), [drawerOpen, setDrawerOpen] = useState(false)
  const drawer = useRef<HTMLDivElement>(null), drawerTrigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null), worker = useRef<Worker | null>(null)
  const urls = useRef(new Set<string>()), dragged = useRef<number | null>(null), importing = useRef(false), mounted = useRef(true)
  useEffect(() => { mounted.current = true; const pool = urls.current; return () => { mounted.current = false; worker.current?.terminate(); pool.forEach(url => URL.revokeObjectURL(url)); pool.clear() } }, [])
  useEffect(() => {
    const element = grid.current
    const preventDragScroll = (event: TouchEvent) => {
      if (dragged.current !== null && event.cancelable) event.preventDefault()
    }
    element?.addEventListener('touchmove', preventDragScroll, { passive: false })
    return () => {
      element?.removeEventListener('touchmove', preventDragScroll)
      if (pendingDrag.current) window.clearTimeout(pendingDrag.current.timer)
      pendingDrag.current = null
    }
  }, [images.length])
  useEffect(() => {
    const media = window.matchMedia('(max-width:700px)')
    const update = () => { setMobile(media.matches); setDrawerOpen(false) }
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!mobile || !drawerOpen) return
    const trigger = drawerTrigger.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawer.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setDrawerOpen(false) }
      if (event.key !== 'Tab') return
      const controls = Array.from(drawer.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled)') ?? [])
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', keydown)
      trigger?.focus({ preventScroll: true })
    }
  }, [mobile, drawerOpen])
  useEffect(() => {
    if (!images.length && !busy) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [images.length, busy])
  const locked = loading || busy
  function invalidate() { setAnnouncement('') }
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
  function reorder(from: number, to: number) {
    if (locked || !images[from] || to < 0 || to >= images.length || from === to) return
    const positions = new Map(Array.from(grid.current?.children ?? []).map(card => [(card as HTMLElement).dataset.imageId, card.getBoundingClientRect()]))
    invalidate(); setImages(previous => moveItem(previous, from, to)); setAnnouncement(`Moved ${images[from].file.name} to page ${to + 1}.`)
    requestAnimationFrame(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      Array.from(grid.current?.children ?? []).forEach(card => {
        const before = positions.get((card as HTMLElement).dataset.imageId), after = card.getBoundingClientRect()
        if (before) card.animate([{ transform: `translate(${before.left - after.left}px,${before.top - after.top}px)` }, { transform: 'translate(0,0)' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' })
      })
    })
  }
  function beginDrag(index: number) {
    dragSlots.current = Array.from(grid.current?.children ?? []).map(card => card.getBoundingClientRect())
    dragScroll.current = grid.current?.closest('.pdf-image-panel')?.scrollTop ?? 0
    dragged.current = index; dropTarget.current = index; setDragIndex(index); setDropIndex(index); setOver(false)
  }
  function targetDrag(index: number | null) { dropTarget.current = index; setDropIndex(index) }
  function endDrag(commit = false) {
    if (pendingDrag.current) window.clearTimeout(pendingDrag.current.timer)
    pendingDrag.current = null
    if (commit && dragged.current !== null && dropTarget.current !== null) reorder(dragged.current, dropTarget.current)
    dragged.current = null; dropTarget.current = null; setDragIndex(null); setDropIndex(null)
    setDragPreview(null)
  }
  function change<K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) { invalidate(); setSettings(previous => ({ ...previous, [key]: value })) }
  function remove(id: string) { invalidate(); const item = images.find(image => image.id === id); if (item) { URL.revokeObjectURL(item.url); urls.current.delete(item.url) }; setImages(previous => previous.filter(image => image.id !== id)) }
  function cancel() { worker.current?.terminate(); worker.current = null; setBusy(false); setProgress(0); setAnnouncement('Conversion stopped. Your images and settings are unchanged.') }
  function convert() {
    if (!images.length || locked || worker.current) return
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
          const link = document.createElement('a')
          link.href = url; link.download = (settings.name.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 80) || 'bloomollo-images') + '.pdf'
          link.hidden = true; document.body.append(link); link.click(); link.remove()
          const pool = urls.current
          window.setTimeout(() => { URL.revokeObjectURL(url); pool.delete(url) }, 60_000)
          setAnnouncement('PDF created. Download started.'); setBusy(false); task.terminate(); worker.current = null
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
        {images.length > 0 && <><p className="pdf-order-help">Drag an image preview to reorder. Arrow buttons work too. Numbers match PDF page order.</p><ol ref={grid} className="pdf-image-grid">{images.map((image, index) => {
          const active = dragIndex === index
          const position = dragIndex !== null && dropIndex !== null ? (active ? dropIndex : dragIndex < dropIndex && index > dragIndex && index <= dropIndex ? index - 1 : dragIndex > dropIndex && index >= dropIndex && index < dragIndex ? index + 1 : index) : index
          return <li key={image.id} data-image-id={image.id} data-index={index} style={{ order: position }} className={active ? 'is-dragging is-drop-target pdf-insertion-slot' : ''}>
          <div className="pdf-thumb" onPointerDown={event => {
            if (locked || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
            const element = event.currentTarget, pointerId = event.pointerId, x = event.clientX, y = event.clientY
            const activate = () => {
              pendingDrag.current = null
              if (!mounted.current || !element.isConnected) return
              element.setPointerCapture(pointerId); beginDrag(index)
              setDragPreview({ x, y, width: element.getBoundingClientRect().width })
            }
            if (event.pointerType === 'touch') {
              endDrag()
              pendingDrag.current = { timer: window.setTimeout(activate, 220), x, y }
            } else { event.preventDefault(); activate() }
          }} onPointerMove={event => {
            if (pendingDrag.current && Math.hypot(event.clientX - pendingDrag.current.x, event.clientY - pendingDrag.current.y) > 8) endDrag()
            if (dragged.current === null || !event.currentTarget.hasPointerCapture(event.pointerId)) return
            setDragPreview(previous => previous && ({ ...previous, x: event.clientX, y: event.clientY }))
            const panel = grid.current?.closest('.pdf-image-panel')
            if (panel) { const rect = panel.getBoundingClientRect(); if (event.clientY < rect.top + 48) panel.scrollTop -= 16; else if (event.clientY > rect.bottom - 48) panel.scrollTop += 16 }
            const offset = (panel?.scrollTop ?? 0) - dragScroll.current
            let nearest = dropTarget.current, distance = Infinity
            dragSlots.current.forEach((rect, slot) => {
              const d = Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2 + offset)
              if (d < distance) { distance = d; nearest = slot }
            })
            targetDrag(nearest)
          }} onPointerUp={event => { endDrag(true); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }} onPointerCancel={() => endDrag()} onLostPointerCapture={() => endDrag()} onContextMenu={event => event.preventDefault()}>
            <span className="pdf-page-number">{index + 1}</span><img draggable={false} src={image.url} alt={image.file.name} style={{ transform: `rotate(${image.rotation}deg)` }} /><button className="pdf-remove" disabled={locked} aria-label={`Remove ${image.file.name}`} onClick={() => remove(image.id)}>×</button></div>
          <div className="pdf-image-info"><strong title={image.file.name}>{image.file.name}</strong><span>{image.width} × {image.height}</span></div>
          <div className="pdf-image-actions"><button disabled={locked || index === 0} aria-label={`Move ${image.file.name} earlier`} onClick={() => reorder(index, index - 1)}>←</button><button disabled={locked} aria-label={`Rotate ${image.file.name}`} onClick={() => { invalidate(); setImages(previous => previous.map(item => item.id === image.id ? { ...item, rotation: (item.rotation + 90) % 360 } : item)) }}>↻ Rotate</button><button disabled={locked || index === images.length - 1} aria-label={`Move ${image.file.name} later`} onClick={() => reorder(index, index + 1)}>→</button></div>
        </li>})}</ol>{dragPreview && dragIndex !== null && <div className="pdf-drag-preview" aria-hidden="true" style={{ width: dragPreview.width, transform: `translate3d(${dragPreview.x - dragPreview.width / 2}px,${dragPreview.y - 70}px,0) rotate(3deg)` }}><img src={images[dragIndex].url} alt="" style={{ transform: `rotate(${images[dragIndex].rotation}deg)` }} /><strong>{images[dragIndex].file.name}</strong></div>}</>}
        {errors.length > 0 && <div className="pdf-errors" role="alert"><strong>Some files need attention</strong><ul>{errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>}
      </section>
      <aside className="pdf-settings" aria-label="PDF controls">
        <button ref={drawerTrigger} className="pdf-drawer-trigger" aria-expanded={drawerOpen} aria-controls="pdf-settings-drawer" onClick={() => setDrawerOpen(true)}><span>PDF settings<small>{settings.size === 'image' ? 'Fit to image' : settings.size === 'letter' ? 'US Letter' : 'A4'} · {settings.orientation === 'auto' ? 'Automatic' : settings.orientation === 'portrait' ? 'Portrait' : 'Landscape'}</small></span><span className="pdf-drawer-open" aria-hidden="true">Open<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path className="pdf-drawer-lift" d="m8 10 4-4 4 4M12 6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span></button>
        <div className={`pdf-drawer-backdrop${drawerOpen ? ' is-open' : ''}`} aria-hidden="true" onClick={() => setDrawerOpen(false)} />
        <div ref={drawer} id="pdf-settings-drawer" className={`pdf-options-scroll${drawerOpen ? ' is-open' : ''}`} role={mobile ? 'dialog' : undefined} aria-modal={mobile && drawerOpen ? true : undefined} aria-labelledby={mobile ? 'pdf-drawer-title' : undefined} inert={mobile && !drawerOpen ? true : undefined}>
        <div className="pdf-drawer-heading"><div><h2 id="pdf-drawer-title">PDF settings</h2><p>Make it yours before downloading.</p></div><button aria-label="Close PDF settings" onClick={() => setDrawerOpen(false)}>×</button></div>
        <details className="pdf-options" open={mobile ? true : undefined}><summary>PDF settings <span aria-hidden="true">+</span></summary>
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
        </fieldset><button className="pdf-drawer-done" onClick={() => setDrawerOpen(false)}>Done <span aria-hidden="true">↓</span></button></div>
        <div className="pdf-export"><div className="pdf-export-summary"><span>{busy ? 'Creating your PDF' : loading ? 'Reading images' : 'Ready to create'}</span><strong>{images.length} page{images.length === 1 ? '' : 's'}</strong></div>
          <button className="pdf-primary" disabled={!images.length || locked} aria-busy={locked} onClick={convert}><span>{busy ? 'Processing…' : loading ? 'Loading images…' : 'Download PDF'}</span>{locked ? <span className="pdf-loading-circle" aria-hidden="true" /> : <svg className="pdf-download-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}</button>
          {busy && <><progress value={progress} max={images.length} /><p role="status">Processing {progress} of {images.length} images…</p><button className="pdf-secondary" onClick={cancel}>Cancel conversion</button></>}
          <p className="pdf-export-note">No uploads. No watermarks. No account.</p></div>
      </aside>
    </div>
  </div>
}