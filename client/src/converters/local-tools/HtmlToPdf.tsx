import { useEffect, useRef, useState } from 'react'
import { prepareHtml } from './html-document'
import { loadHtmlUrl } from './html-url'

export default function HtmlToPdf() {
  const [source, setSource] = useState(''), [preview, setPreview] = useState(''), [error, setError] = useState('')
  const [size, setSize] = useState('a4'), [orientation, setOrientation] = useState('portrait'), [margin, setMargin] = useState('12')
  const [reading, setReading] = useState(false), [status, setStatus] = useState('')
  const [url, setUrl] = useState(''), [loaded, setLoaded] = useState('')
  const [rendered, setRendered] = useState({ source: '', size: '', orientation: '', margin: '' })
  const [previewError, setPreviewError] = useState('')
  const [workspace, setWorkspace] = useState(false), [editing, setEditing] = useState(false), [importing, setImporting] = useState(false)
  const [tab, setTab] = useState('url'), [draft, setDraft] = useState(''), [sourceName, setSourceName] = useState('HTML document')
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  function openImport() { setError(''); setDraft(source); setImporting(true); dialog.current?.showModal() }
  function acceptHtml(html: string, name: string) {
    if (!html.trim()) throw new Error('Add some HTML before continuing.')
    if (new Blob([html]).size > 1_000_000) throw new Error('Choose HTML smaller than 1 MB.')
    setSource(html); setSourceName(name); setWorkspace(true); setEditing(false); setError(''); dialog.current?.close(); setStatus('HTML loaded. Preview updates automatically.')
  }
  const frame = useRef<HTMLIFrameElement>(null)
  const request = useRef<AbortController | null>(null)
  const current = rendered.source === source && rendered.size === size && rendered.orientation === orientation && rendered.margin === margin
  const ready = current && !!preview && loaded === preview && !reading
  useEffect(() => () => request.current?.abort(), [])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewError('')
      try { setPreview(source.trim() ? prepareHtml(source, size, orientation, margin) : '') }
      catch (cause) { setPreview(''); setPreviewError(cause instanceof Error ? cause.message : 'Unable to preview HTML.') }
      setRendered({ source, size, orientation, margin })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [source, size, orientation, margin])
  async function importUrl(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    request.current?.abort()
    const controller = new AbortController(); request.current = controller
    const timer = window.setTimeout(() => controller.abort(), 15000)
    setReading(true); setError(''); setStatus('Loading HTML from URL…')
    try { const html = await loadHtmlUrl(url, controller.signal); if (request.current === controller) acceptHtml(html, url); setStatus('HTML imported. Preview updates automatically.') }
    catch (cause) { if (request.current === controller) { setError(controller.signal.aborted ? 'The request timed out. Try again or upload a saved HTML file.' : cause instanceof TypeError ? 'This website could not be loaded. It may block browser access (CORS). Save the page as HTML and upload it instead.' : cause instanceof Error ? cause.message : 'Could not load this URL.'); setStatus('') } }
    finally { window.clearTimeout(timer); if (request.current === controller) { request.current = null; setReading(false) } }
  }
  async function read(file?: File) {
    if (!file) return
    setError(''); setReading(true)
    try { if (file.size > 1_000_000) throw new Error('Choose an HTML file smaller than 1 MB.'); acceptHtml(await file.text(), file.name); setStatus('HTML loaded. Preview updates automatically.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not read this file.') }
    finally { setReading(false) }
  }
  function print() {
    if (!ready) return
    try { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); setStatus('Choose “Save as PDF” in your browser’s print dialog. The file is saved only after you confirm there.') }
    catch { setError('Printing is unavailable in this browser. Try desktop Chrome, Edge or Firefox.') }
  }
  return <div className={`html-flow ${workspace ? 'html-flow--workspace' : ''}`}>
    {!workspace ? <section className="html-start" aria-label="Add an HTML document">
      <button ref={trigger} className="local-primary html-add" onClick={openImport}>Add HTML <span aria-hidden="true">+</span></button>
      <p>From a URL, an HTML file, or pasted code</p>
      <small>Up to 1 MB &middot; No account needed</small>
    </section> : <div className="html-workspace">
      <section className="html-document" aria-label="Document workspace">
        <div className="html-document-bar"><div><strong>{sourceName}</strong><span>{editing ? 'HTML source' : 'Document preview'}</span></div><button className="local-secondary" onClick={() => setEditing(!editing)}>{editing ? 'Show preview' : 'Edit HTML'}</button></div>
        {editing && <div className="html-editor"><label htmlFor="html-editor">HTML source</label><textarea id="html-editor" aria-label="HTML source" spellCheck={false} value={source} disabled={reading} maxLength={1_000_000} onChange={event => { setSource(event.target.value); setStatus('') }} /><p className="local-hint">Changes update the preview automatically. Choose Show preview to review.</p></div>}
        <div className="html-preview-area" hidden={editing}>
          {preview ? <section className="local-preview" aria-busy={!current}><iframe key={preview} ref={frame} title="Safe HTML document preview" sandbox="allow-same-origin allow-modals" referrerPolicy="no-referrer" srcDoc={preview} onLoad={() => setLoaded(preview)} /></section> : <p className="html-empty">{source.trim() ? 'Preparing preview...' : 'Your HTML is empty. Select Edit HTML to add content.'}</p>}
        </div>
        <div className="html-document-status" role="status">{!source.trim() ? 'No HTML to preview' : ready ? 'Preview ready' : 'Updating preview...'}<span>Final pagination appears in the print dialog</span></div>
      </section>
      <aside className="local-panel html-settings" aria-label="PDF settings"><div className="html-settings-heading"><h2>Print settings</h2><button className="html-text-button" onClick={openImport}>Replace HTML</button></div>
        <fieldset disabled={reading}>
          <fieldset><legend>Paper size</legend><div className="local-choices">{[['a4', 'A4'], ['letter', 'US Letter']].map(([value, label]) => <label key={value}><input type="radio" name="paper" value={value} checked={size === value} onChange={() => setSize(value)} />{label}</label>)}</div></fieldset>
          <fieldset><legend>Orientation</legend><div className="local-choices">{[['portrait', 'Portrait'], ['landscape', 'Landscape']].map(([value, label]) => <label key={value}><input type="radio" name="orientation" value={value} checked={orientation === value} onChange={() => setOrientation(value)} />{label}</label>)}</div></fieldset>
          <fieldset><legend>Margins</legend><div className="local-choices">{[['0', 'None'], ['12', '12 mm'], ['20', '20 mm']].map(([value, label]) => <label key={value}><input type="radio" name="margin" value={value} checked={margin === value} onChange={() => setMargin(value)} />{label}</label>)}</div></fieldset>
          <div className="html-export"><button className="local-primary" disabled={!ready} onClick={print}>Print / Save as PDF <span aria-hidden="true">&rarr;</span></button><p className="local-hint">Opens your browser&#8217;s print dialog. Choose Save as PDF and check the final layout before saving.</p></div>
        </fieldset>
      </aside>
    </div>}
    {previewError && <p role="alert" className="local-error">{previewError}</p>}
    {error && !importing && <p role="alert" className="local-error">{error}</p>}
    <p role="status" aria-live="polite" className="html-status">{status}</p>
    <dialog ref={dialog} className="html-import" aria-labelledby="html-import-title" onCancel={event => { if (reading) event.preventDefault() }} onClose={() => { setImporting(false); setError(''); trigger.current?.focus() }}>
      <div className="html-import-header"><div><h2 id="html-import-title">Add HTML</h2><p>Choose where to import your document from.</p></div><button type="button" className="html-close" aria-label="Close import dialog" disabled={reading} onClick={() => dialog.current?.close()}>&times;</button></div>
      <div className="html-import-tabs" role="group" aria-label="HTML source type">{[['url', 'Website URL'], ['file', 'HTML file'], ['paste', 'Paste HTML']].map(([value, label]) => <button type="button" key={value} aria-pressed={tab === value} disabled={reading} onClick={() => { setTab(value); setError('') }}>{label}</button>)}</div>
      <div className="html-import-body">
        {tab === 'url' && <form id="html-import-form" className="local-url-form" onSubmit={importUrl}><label htmlFor="html-url">Website URL</label><input autoFocus id="html-url" type="url" placeholder="https://example.com/page.html" required value={url} disabled={reading} onChange={event => setUrl(event.target.value)} aria-describedby="html-url-help" /><p id="html-url-help" className="local-hint">Fetched directly without cookies. The website must allow browser access (CORS). If it blocks access, upload a saved HTML file or paste the code instead.</p></form>}
        {tab === 'file' && <div className="html-upload"><label htmlFor="html-file">Choose an HTML file</label><p>.html or .htm &middot; Maximum 1 MB</p><input id="html-file" type="file" accept=".html,.htm,text/html" disabled={reading} onChange={event => { void read(event.target.files?.[0]); event.target.value = '' }} /></div>}
        {tab === 'paste' && <form id="html-import-form" onSubmit={event => { event.preventDefault(); try { acceptHtml(draft, 'Pasted HTML') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add HTML.') } }}><label htmlFor="html-paste">HTML code</label><textarea id="html-paste" spellCheck={false} placeholder="Paste your HTML here..." required maxLength={1_000_000} value={draft} onChange={event => setDraft(event.target.value)} /><p className="local-hint">You can keep editing your HTML in the next step.</p></form>}
        {error && <p role="alert" className="local-error">{error}</p>}
        {reading && <p role="status">Loading HTML...</p>}
      </div>
      <div className="html-import-footer"><span>Scripts and external resources are blocked.</span>{tab !== 'file' ? <button form="html-import-form" className="local-primary" disabled={reading || !(tab === 'url' ? url : draft).trim()}>{reading ? 'Loading...' : 'Add HTML'} <span aria-hidden="true">&rarr;</span></button> : <button className="local-secondary" disabled={reading} onClick={() => dialog.current?.close()}>Cancel</button>}</div>
    </dialog>
    <details className="html-limitations"><summary>Supported HTML and privacy</summary><p>Text, tables, inline CSS and embedded PNG/JPG/GIF/WebP data images are supported. Scripts, forms, embedded frames, SVG, remote images, external stylesheets and fonts are removed or blocked. Documents depending on those resources will look different.</p><p>No HTML is uploaded or persisted. URL imports contact the destination directly. Preview is continuous; final pagination and layout are controlled by your browser&#8217;s print dialog. Browser support varies, especially on mobile.</p></details>
  </div>
}
