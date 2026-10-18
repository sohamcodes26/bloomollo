import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PageItem, SignaturePlacement } from './engine'
import { renderPage } from './raster'
import SignaturePad from './SignaturePad'
import './signing-workspace.css'

type Props = {
  pages: PageItem[]; doc: PDFDocumentProxy; name: string; busy: boolean
  signature: Uint8Array; placements: SignaturePlacement[]
  onSignature: (bytes: Uint8Array) => void; onPlacements: (marks: SignaturePlacement[]) => void
  onExport: () => void; onReset: () => void
}
function SigningPageImage({ doc, page, root }: { doc: PDFDocumentProxy; page: PageItem; root: React.RefObject<HTMLDivElement | null> }) {
  const host = useRef<HTMLImageElement>(null)
  const [image, setImage] = useState(page.thumbnail)
  useEffect(() => {
    let disposed = false, started = false
    const observer = new IntersectionObserver(entries => {
      if (started || !entries.some(entry => entry.isIntersecting)) return
      started = true
      void renderPage(doc, page.index + 1, 1600).then(({ canvas }) => {
        if (!disposed) setImage(canvas.toDataURL('image/png'))
        canvas.width = 0; canvas.height = 0
      }).catch(() => { /* Keep the source thumbnail visible if high-resolution rendering fails. */ })
      observer.disconnect()
    }, { root: root.current, rootMargin: '700px 0px' })
    if (host.current) observer.observe(host.current)
    return () => { disposed = true; observer.disconnect() }
  }, [doc, page.index, root])
  return <img ref={host} className="sign-page-image" src={image} alt={`PDF page ${page.index + 1}`} draggable={false} />
}
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export default function SigningWorkspace({ pages, doc, name, busy, signature, placements, onSignature, onPlacements, onExport, onReset }: Props) {
  const [active, setActive] = useState(0)
  const [ratio, setRatio] = useState(3), [editing, setEditing] = useState(true), [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const stage = useRef<HTMLDivElement>(null), sheets = useRef(new Map<string, HTMLDivElement>()), upload = useRef<HTMLInputElement>(null), importVersion = useRef(0)
  const gesture = useRef<{ id: string; startX: number; startY: number; mark: SignaturePlacement; resize: boolean } | null>(null)
  const page = pages[active], marks = placements.filter(mark => mark.pageId === page.id)
  const allPages = pages.every(item => placements.some(mark => mark.pageId === item.id))
  const preview = useMemo(() => {
    let data = ''; for (const byte of signature) data += String.fromCharCode(byte)
    return signature.length ? 'data:image/png;base64,' + btoa(data) : ''
  }, [signature])
  function goToPage(index: number) {
    const target = pages[index]
    if (!target) return
    setActive(index); setSelected('')
    const node = sheets.current.get(target.id)
    if (node && stage.current) stage.current.scrollTo({ top: node.offsetTop - 24, behavior: 'instant' })
  }
  useEffect(() => {
    const root = stage.current
    if (!root) return
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) visible.set((entry.target as HTMLElement).dataset.pageId!, entry.isIntersecting ? entry.intersectionRect.height : 0)
      let best = '', height = 0
      for (const [id, value] of visible) if (value > height) { best = id; height = value }
      const index = pages.findIndex(item => item.id === best)
      if (index >= 0) setActive(index)
    }, { root, threshold: [0, .1, .25, .5, .75, 1] })
    sheets.current.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [pages])
  async function acceptSignature(bytes: Uint8Array) {
    const version = ++importVersion.current
    if (!bytes.length) { onSignature(bytes); onPlacements([]); return }
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'image/png' }))
    try {
      const img = new Image(); img.src = url; await img.decode()
      if (version !== importVersion.current) return
      // Trim transparent padding so the placement box follows the actual ink.
      if (img.width * img.height > 16_000_000) throw new Error('Choose a signature image under 16 megapixels.')
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0)
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data
      let left = img.width, top = img.height, right = -1, bottom = -1
      for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (pixels[(y * img.width + x) * 4 + 3] > 16) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y) }
      if (right < 0) throw new Error('Draw a signature first; the image is empty.')
      const cropped = document.createElement('canvas'); cropped.width = right - left + 9; cropped.height = bottom - top + 9
      cropped.getContext('2d')!.drawImage(canvas, left, top, right - left + 1, bottom - top + 1, 4, 4, right - left + 1, bottom - top + 1)
      const data = cropped.toDataURL('image/png').split(',')[1]
      const nextRatio = cropped.width / cropped.height
      setRatio(nextRatio); onSignature(Uint8Array.from(atob(data), c => c.charCodeAt(0)))
      if (placements.length) {
        const anchor = placements.find(mark => mark.id === selected) ?? placements[0]
        const source = pages.find(item => item.id === anchor.pageId)!
        onPlacements(fitCopies(anchor, source, placements, nextRatio))
      } else {
        const mark = createMark(35, 65, nextRatio)
        onPlacements([mark]); setSelected(mark.id)
      }
      setError('')
    } catch (cause) { if (version === importVersion.current) setError(cause instanceof Error ? cause.message : 'Choose a valid PNG signature.') }
    finally { URL.revokeObjectURL(url) }
  }
  function createMark(x: number, y: number, imageRatio = ratio, target = page): SignaturePlacement {
    let width = 28, height = width * target.width / target.height / imageRatio
    if (height > 35) { width *= 35 / height; height = 35 }
    return { id: crypto.randomUUID(), pageId: target.id, x: clamp(x, 0, 100 - width), y: clamp(y, 0, 100 - height), width, height }
  }
  function fitCopies(anchor: SignaturePlacement, source: PageItem, copies: SignaturePlacement[], imageRatio = anchor.width * source.width / (anchor.height * source.height)) {
    const factors = copies.map(mark => { const target = pages.find(item => item.id === mark.pageId)!; return target.width / target.height / imageRatio })
    const width = Math.min(anchor.width, 100, ...factors.map(factor => 100 / factor))
    const x = clamp(anchor.x, 0, 100 - width), y = clamp(anchor.y, 0, 100 - Math.max(...factors.map(factor => width * factor)))
    return copies.map((mark, index) => ({ ...mark, x, y, width, height: width * factors[index] }))
  }
  function updateLinked(next: SignaturePlacement) { onPlacements(fitCopies(next, pages.find(item => item.id === next.pageId)!, placements)) }
  function addAt(x = 35, y = 65, target = page) {
    if (!signature.length || busy) return
    const anchor = placements[0]
    const mark = anchor ? { ...anchor, id: crypto.randomUUID(), pageId: target.id, height: anchor.width * target.width / target.height / ratio } : createMark(x, y, ratio, target)
    const copies = [...placements.filter(item => item.pageId !== target.id), mark]
    onPlacements(fitCopies({ ...mark, x, y }, target, copies)); setSelected(mark.id); setActive(pages.findIndex(item => item.id === target.id)); setEditing(false)
  }
  function applyAll(checked: boolean) {
    const anchor = placements.find(mark => mark.id === selected) ?? marks[0] ?? placements[0] ?? createMark(35, 65)
    const source = pages.find(item => item.id === anchor.pageId)!
    if (checked) {
      const copies = pages.map(item => placements.find(mark => mark.pageId === item.id) ?? { ...anchor, id: crypto.randomUUID(), pageId: item.id })
      onPlacements(fitCopies(anchor, source, copies))
    } else {
      const current = marks[0] ?? { ...anchor, id: crypto.randomUUID(), pageId: page.id }
      onPlacements(fitCopies(anchor, source, [current])); setSelected(current.id)
    }
  }
  function begin(event: ReactPointerEvent, mark: SignaturePlacement, resize = false) {
    if (busy) return
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = { id: mark.id, startX: event.clientX, startY: event.clientY, mark, resize }; setSelected(mark.id)
  }
  function move(event: ReactPointerEvent) {
    const g = gesture.current, rect = g && sheets.current.get(g.mark.pageId)?.getBoundingClientRect(); if (!g || !rect || busy) return
    const dx = (event.clientX - g.startX) / rect.width * 100, dy = (event.clientY - g.startY) / rect.height * 100
    const aspect = g.mark.height / g.mark.width
    const width = clamp(g.mark.width + dx, Math.min(5, 100 - g.mark.x, (100 - g.mark.y) / aspect), Math.min(100 - g.mark.x, (100 - g.mark.y) / aspect))
    const next = g.resize ? { ...g.mark, width, height: width * aspect } : { ...g.mark, x: clamp(g.mark.x + dx, 0, 100 - g.mark.width), y: clamp(g.mark.y + dy, 0, 100 - g.mark.height) }
    updateLinked(next)
  }
  return <div className="sign-workspace" aria-label="Signature editor">
    <section className="sign-document">
      <div className="sign-toolbar"><div><button disabled={busy || active === 0} aria-label="Previous page" onClick={() => goToPage(active - 1)}>↑</button><button disabled={busy || active === pages.length - 1} aria-label="Next page" onClick={() => goToPage(active + 1)}>↓</button><span>Page <strong>{active + 1}</strong> / {pages.length}</span></div><span className="sign-filename" title={name}>{name}</span><button disabled={busy} onClick={onReset}>Reset</button></div>
      <div className="sign-document-body"><nav className="sign-thumbnails" aria-label="Document pages">{pages.map((item, index) => <button key={item.id} disabled={busy} className={active === index ? 'is-active' : ''} aria-label={`View page ${index + 1}`} aria-current={active === index ? 'page' : undefined} onClick={() => goToPage(index)}><img src={item.thumbnail} alt="" /><span>{index + 1}{placements.some(mark => mark.pageId === item.id) && <i aria-label="Has signature"> · Signed</i>}</span></button>)}</nav>
        <div ref={stage} className="sign-stage" tabIndex={0} aria-label="Scrollable PDF document"><p className="sign-instruction">Drag your signature onto any page. Scroll to continue through the document.</p>{pages.map((item, index) => <div key={item.id} className="sign-page-wrap"><div ref={node => { if (node) sheets.current.set(item.id, node); else sheets.current.delete(item.id) }} data-page-id={item.id} data-active={active === index} className="sign-sheet" style={{ aspectRatio: `${item.width} / ${item.height}` }} aria-label={`Page ${index + 1}`} onDragOver={event => { if (!busy) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' } }} onDrop={event => { event.preventDefault(); if (event.dataTransfer.getData('application/x-bloomollo-signature') !== 'signature') return; const rect = event.currentTarget.getBoundingClientRect(); addAt((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100, item) }}>
          <SigningPageImage doc={doc} page={item} root={stage} />
          {signature.length > 0 && placements.filter(mark => mark.pageId === item.id).map(mark => <div key={mark.id} role="button" tabIndex={busy ? -1 : 0} aria-disabled={busy} aria-label="Placed signature. Use arrow keys to move; Delete to remove." className={`sign-mark${selected === mark.id ? ' is-selected' : ''}`} style={{ left: `${mark.x}%`, top: `${mark.y}%`, width: `${mark.width}%`, height: `${mark.height}%` }} onPointerDown={event => begin(event, mark)} onPointerMove={move} onPointerUp={() => { gesture.current = null }} onPointerCancel={() => { gesture.current = null }} onFocus={() => { setSelected(mark.id); setActive(index) }} onKeyDown={event => {
            if (busy) return
            if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); onPlacements(placements.filter(p => p.id !== mark.id)); return }
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
            event.preventDefault(); const step = event.shiftKey ? 2 : .25
            updateLinked({ ...mark, x: clamp(mark.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), 0, 100 - mark.width), y: clamp(mark.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0), 0, 100 - mark.height) })
          }}><img src={preview} alt="Your signature" draggable={false} /><button className="sign-resize" disabled={busy} aria-label="Resize signature; use left and right arrow keys" onPointerDown={event => begin(event, mark, true)} onKeyDown={event => {
            event.stopPropagation(); if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault()
            const width = clamp(mark.width + (event.key === 'ArrowRight' ? 1 : -1), Math.min(5, mark.width), Math.min(100 - mark.x, (100 - mark.y) * mark.width / mark.height))
            updateLinked({ ...mark, width, height: width * mark.height / mark.width })
          }}>↘</button></div>)}
        </div><span className="sign-page-caption">{index + 1} / {pages.length}</span></div>)}</div>
      </div>
    </section>
    <aside className="tool-settings sign-settings"><h2>Signing options</h2><p className="sign-type">Simple signature <span>On-device</span></p><fieldset disabled={busy}>
      <h3>Your signature</h3>{signature.length > 0 ? <><div className="sign-asset" draggable={!busy} onDragStart={event => { event.dataTransfer.setData('application/x-bloomollo-signature', 'signature'); event.dataTransfer.effectAllowed = 'copy' }}><span aria-hidden="true">⠿</span><img src={preview} alt="Drag this signature onto your PDF" /><span aria-hidden="true">↗</span></div><p className="local-hint">Drag onto the document, or use the button below on touch devices.</p><button className="local-secondary sign-add" onClick={() => addAt()}>+ Place on page {active + 1}</button><button className="sign-text-button" onClick={() => setEditing(!editing)}>{editing ? 'Hide signature editor' : 'Edit signature'}</button></> : <p className="local-hint">Draw or upload your signature to get started.</p>}
      {editing && <div className="sign-create"><SignaturePad onChange={bytes => { void acceptSignature(bytes) }} /><input ref={upload} type="file" accept="image/png" aria-label="Upload signature PNG" onChange={event => { const file = event.target.files?.[0]; if (!file) return; event.target.value = ''; if (file.size > 2_000_000) { setError('Choose a PNG under 2 MB.'); return } void file.arrayBuffer().then(bytes => acceptSignature(new Uint8Array(bytes))).catch(() => setError('Could not read this image.')) }} /><p className="local-hint">Your signature appears on the current page automatically. Keep drawing to refine it; placements stay linked.</p></div>}
      <label className="sign-all-pages"><input type="checkbox" checked={signature.length > 0 && allPages} disabled={!signature.length} onChange={event => applyAll(event.target.checked)} /><span>Apply signature to all pages</span></label>
      <p className="local-hint">Signature 1 is linked across its pages. Moving or resizing any copy updates every copy. Uncheck to keep it only on the current page; remove individual copies below to use a subset of pages.</p>
      <div className="sign-placements"><h3>Placed signatures <span>{placements.length}</span></h3>{!placements.length && <p className="local-hint">No signatures placed yet.</p>}{placements.map((mark, index) => <div key={mark.id}><button className="sign-placement-link" onClick={() => { goToPage(pages.findIndex(p => p.id === mark.pageId)); setSelected(mark.id) }}>Signature 1 <small>Page {pages.findIndex(p => p.id === mark.pageId) + 1}</small></button><button className="sign-remove" aria-label={`Remove signature ${index + 1}`} onClick={() => onPlacements(placements.filter(p => p.id !== mark.id))}>×</button></div>)}</div>
      <button className="local-primary" disabled={!signature.length || !placements.length || busy} onClick={onExport}>{busy ? 'Creating PDF…' : 'Sign PDF'} <span aria-hidden="true">→</span></button><p className="local-hint">Visual signature only—not certificate-based digital signing. Review the signed PDF before sharing.</p>
    </fieldset>{error && <p className="local-error" role="alert">{error}</p>}</aside>
  </div>
}