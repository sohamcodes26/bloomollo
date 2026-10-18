import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist'
import { downloadBlob, parsePages, safeFilename } from './model'

type Result = { page: number; blob: Blob; url: string; width: number; height: number }
export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null), [password, setPassword] = useState('')
  const [count, setCount] = useState(0), [range, setRange] = useState(''), [dpi, setDpi] = useState('144')
  const [quality, setQuality] = useState('0.9'), [results, setResults] = useState<Result[]>([])
  const [busy, setBusy] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('')
  const doc = useRef<PDFDocumentProxy | null>(null), task = useRef<PDFDocumentLoadingTask | null>(null)
  const cancelled = useRef(false), urls = useRef<string[]>([]), mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancelled.current = true; void task.current?.destroy(); urls.current.forEach(URL.revokeObjectURL) } }, [])
  function clear() { urls.current.forEach(URL.revokeObjectURL); urls.current = []; setResults([]) }
  async function open() {
    if (!file) return
    setBusy(true); setError(''); clear(); setCount(0); setStatus('Reading PDF…'); cancelled.current = false
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('Choose a PDF smaller than 50 MB.')
      await task.current?.destroy(); doc.current = null
      const { loadPdf } = await import('./pdf-engine')
      task.current = loadPdf(new Uint8Array(await file.arrayBuffer()), password)
      const loaded = await task.current.promise
      if (!mounted.current) { await task.current.destroy(); return }
      doc.current = loaded; setCount(loaded.numPages); setStatus(`${loaded.numPages} pages ready. Choose your export settings.`)
    } catch (cause) { if (mounted.current) { setError(cause instanceof Error && cause.name === 'PasswordException' ? 'This PDF needs the correct password. Enter it and open again.' : 'Unable to open this PDF. Check the file and try again. ' + (cause instanceof Error ? cause.message : '')); setStatus('') } }
    finally { if (mounted.current) setBusy(false) }
  }
  async function convert() {
    if (!doc.current) return
    setError(''); setBusy(true); cancelled.current = false; clear()
    const output: Result[] = []
    try {
      const pages = parsePages(range, count)
      if (pages.length > 100) throw new Error('Export up to 100 pages at a time. Choose a smaller page range.')
      let total = 0
      for (const number of pages) {
        if (cancelled.current) break
        setStatus(`Rendering page ${number} · ${output.length + 1} of ${pages.length}`)
        const page = await doc.current.getPage(number), viewport = page.getViewport({ scale: Number(dpi) / 72 })
        if (viewport.width * viewport.height > 24_000_000 || viewport.width > 16000 || viewport.height > 16000) throw new Error(`Page ${number} is too large at this resolution. Choose a lower resolution.`)
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
        try {
          await page.render({ canvas, viewport, background: '#ffffff' }).promise
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image encoding failed.')), 'image/jpeg', Number(quality)))
          total += blob.size
          if (total > 150 * 1024 * 1024) throw new Error('Output exceeds 150 MB. Use fewer pages or lower quality.')
          if (!cancelled.current) { const url = URL.createObjectURL(blob); urls.current.push(url); output.push({ page: number, blob, url, width: canvas.width, height: canvas.height }) }
        } finally { canvas.width = 0; canvas.height = 0; page.cleanup() }
      }
      if (mounted.current) { setResults(output); setStatus(cancelled.current ? `Stopped. ${output.length} images ready.` : `${output.length} images ready to download.`) }
    } catch (cause) { if (mounted.current) { setResults(output); setError(cause instanceof Error ? cause.message : 'Conversion failed. Try fewer pages.'); setStatus('') } }
    finally { if (mounted.current) setBusy(false) }
  }
  const filename = (page: number) => `${safeFilename(file?.name ?? 'document')}-page-${String(page).padStart(3, '0')}.jpg`
  async function zip() {
    setBusy(true); setError(''); setStatus('Preparing ZIP…')
    try {
      const { zip } = await import('fflate'), entries: Record<string, Uint8Array> = {}
      for (const result of results) entries[filename(result.page)] = new Uint8Array(await result.blob.arrayBuffer())
      const bytes = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => zip(entries, { level: 0 }, (err, data) => err ? reject(err) : resolve(new Uint8Array(data))))
      downloadBlob(new Blob([bytes], { type: 'application/zip' }), `${safeFilename(file?.name ?? 'document')}-images.zip`); setStatus('ZIP download started.')
    } catch { setError('Could not prepare ZIP. Download the images individually or use a smaller batch.') }
    finally { setBusy(false) }
  }
  return <>
    <div className="local-layout">
      <section className="local-panel"><h2>PDF file</h2><p>Select a PDF up to 50 MB. Password-protected files need their password.</p>
        <fieldset disabled={busy}><label className="local-file">Choose PDF<input id="local-pdf" type="file" accept="application/pdf,.pdf" onChange={event => { setFile(event.target.files?.[0] ?? null); setCount(0); clear(); setError(''); setStatus(''); setRange(''); void task.current?.destroy(); doc.current = null }} /></label>
          {file && <p>{file.name} · {(file.size / 1048576).toFixed(1)} MB</p>}
          <label>Password, if required<input type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} /></label>
          <button className="local-primary" disabled={!file} onClick={open}>Open PDF</button>
        </fieldset>
      </section>
      <section className="local-panel"><h2>Export settings</h2>
        <fieldset disabled={busy || !count}><label>Pages<input placeholder="All pages — or 1, 3-5" value={range} onChange={event => setRange(event.target.value)} /></label>
          <fieldset><legend>Resolution</legend><div className="local-choices">{['72', '144', '216'].map(value => <label key={value}><input type="radio" name="dpi" checked={dpi === value} onChange={() => setDpi(value)} />{value} DPI</label>)}</div></fieldset>
          <fieldset><legend>JPG quality</legend><div className="local-choices">{[['0.7', 'Compact'], ['0.9', 'Balanced'], ['0.98', 'High']].map(([value, label]) => <label key={value}><input type="radio" name="quality" checked={quality === value} onChange={() => setQuality(value)} />{label}</label>)}</div></fieldset>
          <button className="local-primary" onClick={convert}>Convert to JPG</button>
        </fieldset>
        {busy && <button className="local-secondary" onClick={() => { cancelled.current = true }} disabled={!count}>Stop after current page</button>}
      </section>
    </div>
    <p role="status" aria-live="polite">{status}</p>{error && <p className="local-error" role="alert">{error}</p>}
    {results.length > 0 && <section className="local-results"><div className="local-results-heading"><h2>JPG files <small>{results.length} pages</small></h2><button className="local-primary" disabled={busy} onClick={zip}>Download ZIP</button></div>
      <div className="local-image-grid">{results.map(result => <article key={result.page}><img src={result.url} alt={`PDF page ${result.page}`} loading="lazy" /><div><strong>Page {result.page}</strong><small>{result.width} × {result.height} · {(result.blob.size / 1024).toFixed(0)} KB</small><button className="local-secondary" onClick={() => downloadBlob(result.blob, filename(result.page))}>Download JPG ↓</button></div></article>)}</div>
    </section>}
    <section className="local-notes"><h2>What this tool does</h2><p>Each selected page becomes one JPG, including text and images. It does not extract original embedded images or perform OCR. Transparent areas become white. JPG uses lossy compression. Export up to 100 pages per batch, 24 megapixels per page and 150 MB total output; device memory may impose lower limits.</p><p>All processing happens in this browser. Your PDF, password and generated images are not uploaded or saved by Bloomollo. Close or reload this page to clear the session.</p></section>
  </>
}
