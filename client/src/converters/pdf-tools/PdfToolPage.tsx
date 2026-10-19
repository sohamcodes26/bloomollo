import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import BrandWordmark from '../../components/BrandWordmark'
import LegalFooter from '../../components/LegalFooter'
import PdfToolsMenu from '../../components/PdfToolsMenu'
import { downloadBlob } from '../local-tools/model'
import { buildPdf, fillForm, initialSettings, inspectForm, splitGroups } from './engine'
import type { FormValue, PageItem, Settings, SignaturePlacement, TextBox } from './engine'
import type { PdfTool } from './catalog'
import { rasterPdf, renderPage } from './raster'
import SigningWorkspace from './SigningWorkspace'
import VisualPage from './VisualPages'
import TextWorkspace from './TextWorkspace'
import './visual-workspace.css'
import '../local-tools/local-tools.css'
import './pdf-tools.css'

type Source = { name: string; bytes: Uint8Array; doc: PDFDocumentProxy }
export default function PdfToolPage({ tool }: { tool: PdfTool }) {
  const [sources, setSources] = useState<Source[]>([]), [pages, setPages] = useState<PageItem[]>([])
  const [settings, setSettings] = useState<Settings>(initialSettings), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [status, setStatus] = useState(''), [groups, setGroups] = useState(''), [dpi, setDpi] = useState(96)
  const [fields, setFields] = useState<FormValue[]>([]), [signature, setSignature] = useState<Uint8Array>(new Uint8Array())
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([])
  const [placements, setPlacements] = useState<SignaturePlacement[]>([])
  const [result, setResult] = useState<{ url: string; bytes: Uint8Array; name: string } | null>(null)
  const docs = useRef<PDFDocumentProxy[]>([]), resultUrl = useRef(''), cancelled = useRef(false), mounted = useRef(true)
  const input = useRef<HTMLInputElement>(null)
  const multiple = ['merge-pdf', 'organize-pdf', 'compare-pdf'].includes(tool.slug)
  const selected = pages.filter(page => page.selected)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancelled.current = true; docs.current.forEach(doc => { void doc.loadingTask.destroy() }); URL.revokeObjectURL(resultUrl.current) } }, [])
  function invalidate() { if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); resultUrl.current = ''; setResult(null) }
  function change<K extends keyof Settings>(key: K, value: Settings[K]) { setSettings(current => ({ ...current, [key]: value })); invalidate() }
  async function addFiles(files: FileList | File[]) {
    if (!files.length || busy) return
    const chosen = Array.from(files)
    setError(''); setBusy(true); invalidate(); cancelled.current = false
    const fresh: Source[] = []
    let committed = false
    try {
      if ((!multiple && (chosen.length > 1 || sources.length)) || (tool.slug === 'compare-pdf' && sources.length + chosen.length > 2)) throw new Error('Reset the workspace to select different files. This tool accepts ' + (multiple ? 'two PDFs.' : 'one PDF.'))
      if (sources.length + chosen.length > 10) throw new Error('Choose up to 10 PDFs.')
      let total = sources.reduce((n, source) => n + source.bytes.length, 0), count = pages.length
      const { loadPdf } = await import('../local-tools/pdf-engine'), { PDFDocument } = await import('pdf-lib')
      const next: PageItem[] = []
      for (const [fileIndex, file] of chosen.entries()) {
        if (file.size > 50 * 1024 * 1024) throw new Error('Each PDF must be smaller than 50 MB.')
        total += file.size; if (total > 100 * 1024 * 1024) throw new Error('Choose up to 100 MB in total.')
        const bytes = new Uint8Array(await file.arrayBuffer())
        // Never bypass encryption. Page-copy operations flatten existing forms explicitly.
        const parsed = await PDFDocument.load(bytes)
        if (tool.slug !== 'pdf-forms' && parsed.getForm().hasXFA()) throw new Error('XFA documents are unsupported. Export a standard PDF first.')
        const task = loadPdf(bytes.slice(), '')
        let doc: PDFDocumentProxy
        try { doc = await task.promise } catch (cause) { await task.destroy(); throw cause }
        fresh.push({ name: file.name, bytes, doc })
        count += doc.numPages; if (count > 100) throw new Error('Open up to 100 pages per workspace.')
        for (let index = 0; index < doc.numPages; index++) {
          if (cancelled.current || !mounted.current) throw new Error('Loading cancelled.')
          setStatus(`Reading ${file.name} · page ${index + 1} of ${doc.numPages}`)
          const { canvas, width, height } = await renderPage(doc, index + 1, tool.slug === 'compare-pdf' ? 720 : 220)
          const thumbnail = canvas.toDataURL('image/jpeg', .75); canvas.width = 0; canvas.height = 0
          next.push({ id: `${sources.length + fileIndex}-${index}`, file: sources.length + fileIndex, index, rotation: 0, selected: true, thumbnail, width, height })
        }
      }
      const formFields = tool.slug === 'pdf-forms' ? await inspectForm(fresh[0].bytes) : []
      if (!mounted.current) return
      docs.current.push(...fresh.map(source => source.doc)); setSources(current => [...current, ...fresh]); setPages(current => [...current, ...next]); setFields(formFields)
      committed = true
      setStatus('Files ready. Select pages and review settings.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open PDF. Encrypted files are not supported here.'); setStatus('') }
    finally { if (!committed) fresh.forEach(source => { void source.doc.loadingTask.destroy() }); if (mounted.current) setBusy(false) }
  }
  function move(index: number, delta: number) {
    const next = [...pages], target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]; setPages(next); invalidate()
  }
  async function exportDocument() {
    setBusy(true); setError(''); invalidate(); cancelled.current = false
    try {
      if (!selected.length) throw new Error('Select at least one page.')
      if (tool.slug === 'sign-pdf' && (!signature.length || !placements.length)) throw new Error('Place a signature on the document first.')
      if (tool.slug === 'split-pdf') {
        const { zipSync, strToU8 } = await import('fflate'); const entries: Record<string, Uint8Array> = {}
        const chunks = splitGroups(groups, pages.length)
        for (const [index, group] of chunks.entries()) {
          if (cancelled.current) throw new Error('Export cancelled.')
          entries[`part-${index + 1}.pdf`] = await buildPdf(sources.map(s => s.bytes), group.map(n => pages[n - 1]), tool.slug, settings)
          setStatus(`Creating part ${index + 1} of ${chunks.length}`)
        }
        entries['readme.txt'] = strToU8('Created locally by Bloomollo. Each PDF corresponds to a requested page group.')
        downloadBlob(new Blob([new Uint8Array(zipSync(entries, { level: 0 }))], { type: 'application/zip' }), 'split-pages.zip'); setStatus('ZIP download started.'); return
      }
      if (tool.slug === 'pdf-to-markdown') {
        let markdown = ''
        for (const item of selected) {
          if (cancelled.current) throw new Error('Export cancelled.')
          const page = await sources[item.file].doc.getPage(item.index + 1), text = await page.getTextContent()
          markdown += `## Page ${item.index + 1}\n\n` + text.items.map(item => 'str' in item ? item.str.replace(/[\\`*_{}[\]<>#!|]/g, '\\$&') + (item.hasEOL ? '\n' : ' ') : '').join('') + '\n\n'
        }
        if (!markdown.replace(/## Page \d+/g, '').trim()) throw new Error('No selectable text found. Scanned PDFs need OCR, which is not included.')
        downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), 'document.md'); setStatus('Markdown download started.'); return
      }
      let bytes: Uint8Array
      if (tool.slug === 'pdf-forms') bytes = await fillForm(sources[0].bytes, fields, settings.flatten)
      else if (tool.slug === 'compress-pdf' || tool.slug === 'redact-pdf') bytes = await rasterPdf(sources[0].doc, new Set(selected.map(p => p.index)), tool.slug === 'redact-pdf', settings, tool.slug === 'redact-pdf' ? 144 : dpi, n => setStatus(`Rendering page ${n} of ${pages.length}`), () => cancelled.current)
      else {
        const output = tool.slug === 'remove-pages' ? pages.filter(page => !page.selected) : tool.slug === 'extract-pages' ? selected : pages
        bytes = await buildPdf(sources.map(s => s.bytes), output, tool.slug, settings, signature.length ? signature : undefined, tool.slug === 'sign-pdf' ? placements : undefined, tool.slug === 'edit-pdf' ? textBoxes : undefined)
      }
      if (cancelled.current || !mounted.current) throw new Error('Export cancelled.')
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })); resultUrl.current = url
      setResult({ url, bytes, name: `${tool.slug}.pdf` }); setStatus(`PDF ready · ${(bytes.length / 1024).toFixed(0)} KB${tool.slug === 'compress-pdf' ? ` · original ${(sources[0].bytes.length / 1024).toFixed(0)} KB` : ''}. Review the result before downloading.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not export. Try a smaller file.'); setStatus('') }
    finally { if (mounted.current) setBusy(false) }
  }
  function numeric(key: keyof Settings, label: string, min: number, max: number, step = 1) {
    return <label>{label}<input type="number" min={min} max={max} step={step} value={settings[key] as number} onChange={event => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) { setSettings(current => ({ ...current, [key]: Math.max(min, Math.min(max, value)) })); setResult(null) } }} /></label>
  }
  const [zoom, setZoom] = useState(100)
  const visual = !['merge-pdf', 'split-pdf', 'remove-pages', 'extract-pages', 'organize-pdf', 'rotate-pdf', 'compare-pdf'].includes(tool.slug)
  const positionControls = ['watermark-pdf', 'edit-pdf', 'redact-pdf'].includes(tool.slug)
  return <><a href="#main-content" className="skip-link">Skip to content</a><main id="main-content" className={`local-tool pdf-toolbox${tool.slug === 'sign-pdf' && pages.length ? ' is-signing' : pages.length ? ' is-editing' : ''}`}>
    <header className="local-toolbar"><a href="/" aria-label="Bloomollo home"><BrandWordmark /></a><a href="/tools/">All tools</a><PdfToolsMenu /><span><i /> Files stay on your device</span></header>
    <nav className="local-breadcrumb" aria-label="Breadcrumb"><a href="/tools/">Tools</a> / <span aria-current="page">{tool.name}</span></nav>
    <header className="local-intro"><h1>{tool.name}</h1><p>{tool.description}</p></header>
    <input ref={input} id="tool-pdf-input" className="tool-file-input" type="file" accept="application/pdf,.pdf" multiple={multiple} disabled={busy} onChange={event => { if (event.target.files) void addFiles(event.target.files); event.target.value = '' }} />
    {!pages.length ? <section className="tool-start" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void addFiles(event.dataTransfer.files) }}><button className="local-primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Reading PDF…' : multiple ? 'Select PDF files' : 'Select PDF file'} <span aria-hidden="true">+</span></button><p>or drop {multiple ? 'your files' : 'a file'} here</p><small>50 MB per file · 100 pages total · Unencrypted PDFs</small></section> : tool.slug === 'edit-pdf' ? <TextWorkspace pages={pages} doc={sources[0].doc} bytes={sources[0].bytes} busy={busy} boxes={textBoxes} onBoxes={next => { setTextBoxes(next); invalidate() }} onExport={() => { void exportDocument() }} onReset={() => { docs.current.forEach(doc => { void doc.loadingTask.destroy() }); docs.current = []; setPages([]); setSources([]); setTextBoxes([]); invalidate(); setStatus(''); setError('') }} /> : tool.slug === 'sign-pdf' ? <SigningWorkspace pages={pages} doc={sources[0].doc} name={sources[0].name} busy={busy} signature={signature} placements={placements} onSignature={bytes => { setSignature(bytes); invalidate() }} onPlacements={marks => { setPlacements(marks); invalidate() }} onExport={() => { void exportDocument() }} onReset={() => { docs.current.forEach(doc => { void doc.loadingTask.destroy() }); docs.current = []; setPages([]); setSources([]); setSignature(new Uint8Array()); setPlacements([]); invalidate(); setStatus(''); setError('') }} /> : <div className={`tool-workspace${visual ? ' is-visual' : ''}`}>
      <section className="tool-pages" aria-label="PDF page workspace"><div className="tool-pages-bar"><strong>{tool.name} / {pages.length} pages · {sources.length} {sources.length === 1 ? 'file' : 'files'}</strong><div>{multiple && sources.length < (tool.slug === 'compare-pdf' ? 2 : 10) && <button className="local-secondary" disabled={busy} onClick={() => input.current?.click()}>Add PDF</button>}<button className="local-secondary" disabled={busy} onClick={() => { docs.current.forEach(doc => { void doc.loadingTask.destroy() }); docs.current = []; setPages([]); setSources([]); setFields([]); invalidate(); setStatus(''); setError('') }}>Reset</button></div></div>
        {tool.slug === 'compare-pdf' ? <div className="tool-compare">{sources.map((source, index) => <section key={index}><h2>{source.name}</h2>{pages.filter(p => p.file === index).map(page => <figure key={page.id}><VisualPage page={page} index={page.index} doc={source.doc} bytes={source.bytes} operation="compare-pdf" settings={settings} fields={fields} busy={busy} onSettings={() => {}} /><figcaption>Page {page.index + 1}</figcaption></figure>)}</section>)}</div> : <>
          <div className={visual ? 'visual-page-scroll' : 'tool-grid-scroll'}><div className={visual ? 'tool-page-grid visual-page-list' : 'tool-page-grid'} style={visual ? { width: `${zoom}%`, minWidth: zoom > 100 ? '700px' : undefined } : undefined}>{pages.map((page, index) => <article key={page.id} className={page.selected ? 'tool-page is-selected' : 'tool-page'}><label className="tool-page-check"><input type="checkbox" checked={page.selected} disabled={busy} onChange={() => { setPages(pages.map(p => p.id === page.id ? { ...p, selected: !p.selected } : p)); invalidate() }} /><span>Page {index + 1}</span></label>{visual ? <VisualPage page={page} index={index} doc={sources[page.file].doc} bytes={sources[page.file].bytes} operation={tool.slug} settings={settings} fields={fields} busy={busy} onSettings={next => { setSettings(next); invalidate() }} /> : <div className="tool-thumbnail"><img src={page.thumbnail} style={{ transform: `rotate(${page.rotation}deg)` }} alt={`Source page ${page.index + 1}`} />{page.selected && positionControls && <div className={tool.slug === 'redact-pdf' ? 'tool-overlay tool-overlay-redact' : 'tool-overlay'} style={{ left: `${settings.x}%`, top: `${settings.y}%`, width: `${settings.width}%`, height: `${settings.height}%` }}>{tool.slug === 'redact-pdf' ? '' : settings.text || 'Text'}</div>}{page.selected && tool.slug === 'crop-pdf' && <div className="tool-crop" style={{ inset: `${settings.crop / page.height * 100}% ${settings.crop / page.width * 100}%` }} />}</div>}<small title={sources[page.file]?.name}>{sources[page.file]?.name} · {page.index + 1}</small>
            <div className="tool-page-actions">{['merge-pdf', 'organize-pdf'].includes(tool.slug) && <><button aria-label={`Move page ${index + 1} earlier`} disabled={busy || index === 0} onClick={() => move(index, -1)}>←</button><button aria-label={`Move page ${index + 1} later`} disabled={busy || index === pages.length - 1} onClick={() => move(index, 1)}>→</button></>}{['merge-pdf', 'organize-pdf', 'rotate-pdf'].includes(tool.slug) && <button disabled={busy} aria-label={`Rotate page ${index + 1}`} onClick={() => { setPages(pages.map(p => p.id === page.id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)); invalidate() }}>↻</button>}{tool.slug === 'organize-pdf' && <button disabled={busy || pages.length < 2} aria-label={`Remove page ${index + 1}`} onClick={() => { setPages(pages.filter(p => p.id !== page.id)); invalidate() }}>×</button>}</div></article>)}</div></div>
        </>}
      </section>
      <aside className="local-panel tool-settings"><h2>{tool.slug === 'compare-pdf' ? 'Compare documents' : 'Output settings'}</h2><fieldset disabled={busy}>
        <section className="workspace-sidebar-controls" aria-label="Document controls">
          {tool.slug !== 'compare-pdf' && <div className="tool-selection"><span>{selected.length} selected</span><button disabled={busy} onClick={() => { setPages(pages.map(p => ({ ...p, selected: true }))); invalidate() }}>Select all</button><button disabled={busy} onClick={() => { setPages(pages.map(p => ({ ...p, selected: false }))); invalidate() }}>Select none</button></div>}
          {visual && <div className="visual-toolbar"><span>Scroll to review every page</span><label>Zoom <select aria-label="Document zoom" value={zoom} onChange={event => setZoom(Number(event.target.value))}><option value={75}>75%</option><option value={100}>Fit width</option><option value={125}>125%</option><option value={150}>150%</option></select></label></div>}
        </section>
        <p className="local-hint">{tool.slug === 'remove-pages' ? 'Selected pages will be removed.' : tool.slug === 'extract-pages' ? 'Only selected pages will be exported.' : tool.slug === 'split-pdf' ? 'Groups use original page numbers. Empty input creates one PDF per page; selection is not used.' : ['merge-pdf', 'organize-pdf'].includes(tool.slug) ? 'Every visible page is exported in workspace order. Selection is not used.' : 'Settings apply to selected pages. Unselected pages are kept.'}</p>
        {tool.slug === 'rotate-pdf' && <button className="local-secondary" onClick={() => { setPages(pages.map(p => p.selected ? { ...p, rotation: (p.rotation + 90) % 360 } : p)); invalidate() }}>Rotate selected 90°</button>}
        {tool.slug === 'split-pdf' && <label>Page groups<input placeholder="1-3;4-6;7,9" value={groups} onChange={event => { setGroups(event.target.value); invalidate() }} /></label>}
        {['watermark-pdf', 'edit-pdf'].includes(tool.slug) && <label>Text<textarea rows={3} maxLength={500} value={settings.text} onChange={event => change('text', event.target.value)} /></label>}
        {['page-numbers', 'watermark-pdf', 'edit-pdf'].includes(tool.slug) && numeric('fontSize', 'Font size (points)', 6, 144)}
        {tool.slug === 'page-numbers' && numeric('start', 'Start numbering at', 1, 99999)}
        {tool.slug === 'watermark-pdf' && numeric('opacity', 'Opacity', .05, 1, .05)}
        {tool.slug === 'crop-pdf' && numeric('crop', 'Inset from every edge (points)', 0, 300)}
        {positionControls && <p className="local-hint">Drag the outlined area directly on the page. Use arrow keys for fine adjustments. {tool.slug === 'redact-pdf' ? 'Drag its corner to resize. The same rectangle applies to every selected page.' : 'Text updates automatically. Placement applies to every selected page.'}</p>}
        {tool.slug === 'page-numbers' && <p className="local-hint">Drag the page number to reposition it on every selected page.</p>}
        {tool.slug === 'compress-pdf' && <label>Image resolution<select value={dpi} onChange={event => { setDpi(Number(event.target.value)); invalidate() }}><option value={72}>72 DPI · smallest</option><option value={96}>96 DPI · balanced</option><option value={144}>144 DPI · clearer</option></select></label>}
        {['compress-pdf', 'redact-pdf'].includes(tool.slug) && <p className="tool-warning">All pages become images. Searchable text, links, forms, accessibility tags and signatures are lost. {tool.slug === 'redact-pdf' ? 'Black boxes apply to the same percentage area on every selected page. Review every page; only the selected rectangle is removed.' : 'The output may be larger than the original. Keep the original document.'}</p>}
        {tool.slug === 'pdf-forms' && <><div className="tool-form-fields">{!fields.length && <p>No supported form fields found. This tool fills existing AcroForms, not scanned forms.</p>}{fields.map((field, index) => <label key={field.name}>{field.name}{field.kind === 'check' ? <input type="checkbox" disabled={field.readonly} checked={field.value === 'true'} onChange={event => { setFields(fields.map((f, i) => i === index ? { ...f, value: String(event.target.checked) } : f)); invalidate() }} /> : field.kind === 'choice' ? <select disabled={field.readonly} value={field.value} onChange={event => { setFields(fields.map((f, i) => i === index ? { ...f, value: event.target.value } : f)); invalidate() }}><option value="">Not selected</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : field.kind === 'text' ? <input value={field.value} maxLength={field.max} disabled={field.readonly} onChange={event => { setFields(fields.map((f, i) => i === index ? { ...f, value: event.target.value } : f)); invalidate() }} /> : <small>Unsupported field; left unchanged.</small>}</label>)}</div><label><input type="checkbox" checked={settings.flatten} onChange={event => change('flatten', event.target.checked)} /> Flatten fields (make non-editable)</label><p className="local-hint">Field edits appear in the page preview automatically. Review the generated PDF before downloading.</p></>}
        {tool.slug === 'compare-pdf' ? <p className="local-hint">Add two documents. Scroll each column independently to inspect pages. This is manual comparison, not an automated diff.</p> : <button className="local-primary" disabled={!selected.length || (tool.slug === 'pdf-forms' && !fields.length)} onClick={() => { void exportDocument() }}>{tool.slug === 'split-pdf' ? 'Create ZIP' : tool.slug === 'pdf-to-markdown' ? 'Download Markdown' : 'Create PDF'} <span aria-hidden="true">→</span></button>}
      </fieldset>{busy && <button className="local-secondary" onClick={() => { cancelled.current = true }}>Cancel export</button>}
      </aside>
    </div>}
    <p role="status" aria-live="polite">{status}</p>{error && <p role="alert" className="local-error">{error}</p>}
    {result && <section className="tool-result"><div><h2>Review your PDF</h2><a href={result.url} target="_blank" rel="noopener noreferrer">Open preview in a new tab ↗</a><button className="local-primary" onClick={() => downloadBlob(new Blob([new Uint8Array(result.bytes)], { type: 'application/pdf' }), result.name)}>Download PDF ↓</button></div><iframe title="Generated PDF preview" src={result.url} /></section>}
    <details className="tool-boundaries"><summary>Limits and document handling</summary><p>Up to 10 files, 50 MB each, 100 MB combined and 100 pages. Processing stays in this tab; leaving clears the workspace. Encrypted and XFA documents are unsupported. Existing digital signatures are invalidated by modifications. Page-copy tools flatten existing forms and do not preserve document bookmarks, attachments, accessibility structure or document-level metadata. Text overlays and form appearances use standard fonts and may reject unsupported characters. Cropping hides content; it does not securely remove it. Always review downloaded output.</p></details>
  </main><LegalFooter variant="tool" /></>
}
