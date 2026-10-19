import { useEffect, useState } from 'react'
import type { PointerEvent } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PDFFont } from 'pdf-lib'
import { initialSettings, textBoxLines, textFontIndex, textFonts } from './engine'
import type { PageItem, TextBox } from './engine'
import VisualPage from './VisualPages'
import './text-workspace.css'

type Props = { pages: PageItem[]; doc: PDFDocumentProxy; bytes: Uint8Array; busy: boolean; boxes: TextBox[]; onBoxes: (boxes: TextBox[]) => void; onExport: () => void; onReset: () => void }
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const noFields: never[] = []
const noop = () => {}
export default function TextWorkspace({ pages, doc, bytes, busy, boxes, onBoxes, onExport, onReset }: Props) {
  const [selected, setSelected] = useState(''), [active, setActive] = useState(pages[0].id), [zoom, setZoom] = useState(100)
  const [fonts, setFonts] = useState<PDFFont[]>([]), [error, setError] = useState('')
  const [clipboard, setClipboard] = useState<TextBox | null>(null)
  const [sheets] = useState(() => new Map<string, HTMLDivElement>())
  const [gesture, setGesture] = useState<{ box: TextBox; x: number; y: number; width: number; height: number; handle: string } | null>(null)
  const selectedBox = boxes.find(box => box.id === selected)
  useEffect(() => { let disposed = false; void textFonts().then(value => { if (!disposed) setFonts(value) }).catch(() => { if (!disposed) setError('Could not load text metrics. Reload before exporting.') }); return () => { disposed = true } }, [])
  function update(patch: Partial<TextBox>) { if (selectedBox && !busy) onBoxes(boxes.map(box => box.id === selectedBox.id ? { ...box, ...patch } : box)) }
  function add(copy?: TextBox) {
    if (busy) return
    const page = pages.find(page => page.id === active) ?? pages[0]
    const box: TextBox = copy ? { ...copy, id: crypto.randomUUID(), pageId: page.id, x: Math.min(copy.x + 2, 100 - copy.width), y: Math.min(copy.y + 2, 100 - copy.height) } : { id: crypto.randomUUID(), pageId: page.id, x: 10, y: 10, width: 40, height: Math.min(85, Math.max(15, 18 * 3 / page.height * 100)), text: 'Type your text', fontSize: 18, family: 'sans', bold: false, italic: false, color: '#142333', align: 'left' }
    onBoxes([...boxes, box]); setSelected(box.id)
    sheets.get(page.id)?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
  function remove() { if (!busy) { onBoxes(boxes.filter(box => box.id !== selected)); setSelected('') } }
  function copyBox() { if (selectedBox) setClipboard({ ...selectedBox }) }
  function pasteBox() { if (clipboard) add(clipboard) }
  function begin(event: PointerEvent<HTMLElement>, box: TextBox, handle = '') {
    if (busy || event.button !== 0) return
    event.preventDefault(); event.stopPropagation(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId)
    setSelected(box.id); setActive(box.pageId)
    const rect = sheets.get(box.pageId)!.getBoundingClientRect()
    setGesture({ box: { ...box }, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, handle })
  }
  function move(event: PointerEvent<HTMLElement>) {
    const g = gesture
    if (!g) return
    const dx = (event.clientX - g.x) / g.width * 100, dy = (event.clientY - g.y) / g.height * 100
    let { x, y, width, height } = g.box
    if (!g.handle) { x = clamp(x + dx, 0, 100 - width); y = clamp(y + dy, 0, 100 - height) }
    else {
      if (g.handle.includes('e')) width = clamp(width + dx, 3, 100 - x)
      if (g.handle.includes('s')) height = clamp(height + dy, 2, 100 - y)
      if (g.handle.includes('w')) { const left = clamp(x + dx, 0, x + width - 3); width += x - left; x = left }
      if (g.handle.includes('n')) { const top = clamp(y + dy, 0, y + height - 2); height += y - top; y = top }
    }
    onBoxes(boxes.map(box => box.id === g.box.id ? { ...box, x, y, width, height } : box))
  }
  function layout(box: TextBox, page: PageItem) {
    if (!fonts.length) return { lines: [], error: '' }
    try { return { lines: textBoxLines(box, page.width * box.width / 100, page.height * box.height / 100, text => fonts[textFontIndex(box)].widthOfTextAtSize(text, box.fontSize)), error: '' } }
    catch (cause) { return { lines: [{ text: box.text, y: box.fontSize, width: 0 }], error: cause instanceof Error ? cause.message : 'Invalid text.' } }
  }
  const invalid = boxes.some(box => layout(box, pages.find(page => page.id === box.pageId)!).error)
  return <div className="tool-workspace text-workspace" onKeyDown={event => {
    if (busy || (event.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]')) return
    const mod = event.ctrlKey || event.metaKey, key = event.key.toLowerCase()
    if (mod && ['c', 'v', 'd', 'x'].includes(key)) {
      event.preventDefault()
      if (key === 'c') copyBox()
      if (key === 'v') pasteBox()
      if (key === 'd' && selectedBox) add(selectedBox)
      if (key === 'x' && selectedBox) { copyBox(); remove() }
    } else if (event.key === 'Delete' || event.key === 'Backspace') { if (selectedBox) { event.preventDefault(); remove() } }
    else if (event.key === 'Escape') setSelected('')
    else if (selectedBox && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); const step = event.shiftKey ? 2 : .25
      update({ x: clamp(selectedBox.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), 0, 100 - selectedBox.width), y: clamp(selectedBox.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0), 0, 100 - selectedBox.height) })
    }
  }}>
    <section className="tool-pages" aria-label="PDF text editor"><div className="tool-pages-bar"><strong>Add text to PDF / {pages.length} pages</strong><button className="local-secondary" disabled={busy} onClick={onReset}>Reset</button></div>
      <div className="visual-page-scroll"><div className="text-page-list" style={{ width: `${zoom}%` }}>{pages.map((page, index) => <article key={page.id} className="text-page"><button className="text-page-label" aria-pressed={active === page.id} onClick={() => setActive(page.id)}>Page {index + 1}</button>
        <div className="text-sheet" ref={node => { if (node) sheets.set(page.id, node); else sheets.delete(page.id) }} onPointerDown={() => { setSelected(''); setActive(page.id) }}>
          <VisualPage page={page} index={index} doc={doc} bytes={bytes} operation="text-background" settings={initialSettings} fields={noFields} busy={busy} onSettings={noop} />
          {boxes.filter(box => box.pageId === page.id).map((box, boxIndex) => {
            const content = layout(box, page), w = page.width * box.width / 100, h = page.height * box.height / 100
            return <div key={box.id} data-box-id={box.id} className={`pdf-text-box${selected === box.id ? ' is-selected' : ''}${content.error ? ' has-overflow' : ''}`} role="button" tabIndex={busy ? -1 : 0} aria-label={`Text box ${boxIndex + 1} on page ${index + 1}`} aria-pressed={selected === box.id} style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }} onFocus={() => { setSelected(box.id); setActive(page.id) }} onDoubleClick={() => document.querySelector<HTMLTextAreaElement>('#selected-box-text')?.focus()} onPointerDown={event => begin(event, box)} onPointerMove={move} onPointerUp={() => { setGesture(null) }} onPointerCancel={() => { setGesture(null) }}>
              <svg className="text-box-content" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><text fontFamily={box.family === 'serif' ? 'Times New Roman, serif' : box.family === 'mono' ? 'Courier New, monospace' : 'Helvetica, Arial, sans-serif'} fontSize={box.fontSize} fontWeight={box.bold ? 'bold' : 'normal'} fontStyle={box.italic ? 'italic' : 'normal'} fill={box.color}>{content.lines.map((line, i) => <tspan key={i} x={box.align === 'center' ? w / 2 : box.align === 'right' ? w : 0} y={line.y} textAnchor={box.align === 'center' ? 'middle' : box.align === 'right' ? 'end' : 'start'}>{line.text}</tspan>)}</text></svg>
              {selected === box.id && ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => <button key={handle} className={`text-box-resize handle-${handle}`} aria-label={`Resize text box ${handle}`} disabled={busy} onPointerDown={event => begin(event, box, handle)} onPointerMove={move} onPointerUp={() => { setGesture(null) }} onPointerCancel={() => { setGesture(null) }} onKeyDown={event => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
                event.preventDefault(); event.stopPropagation(); update({ width: clamp(box.width + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0), 3, 100 - box.x), height: clamp(box.height + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0), 2, 100 - box.y) })
              }} />)}
            </div>
          })}
        </div>
      </article>)}</div></div>
    </section>
    <aside className="local-panel tool-settings"><h2>Text boxes</h2><fieldset disabled={busy}>
      <button className="local-primary text-add" onClick={() => add()}>＋ Add text box</button>
      <div className="text-editor-row"><label>Page<select aria-label="Active page" value={active} onChange={event => { setActive(event.target.value); sheets.get(event.target.value)?.scrollIntoView({ block: 'start', behavior: 'instant' }) }}>{pages.map((page, index) => <option key={page.id} value={page.id}>{index + 1}</option>)}</select></label><label>Zoom<select aria-label="Document zoom" value={zoom} onChange={event => setZoom(Number(event.target.value))}><option value={75}>75%</option><option value={100}>Fit width</option><option value={125}>125%</option><option value={150}>150%</option></select></label></div>
      <p className="local-hint">Add a box to the chosen page. Drag it to move; use its handles to resize. Double-click to edit its text.</p>
      {selectedBox ? <section className="text-formatting" aria-label="Selected text box formatting">
        <label>Text<textarea id="selected-box-text" aria-label="Text box content" value={selectedBox.text} maxLength={5000} onChange={event => update({ text: event.target.value })} /></label>
        <label>Font<select aria-label="Font family" value={selectedBox.family} onChange={event => update({ family: event.target.value as TextBox['family'] })}><option value="sans">Sans serif</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></label>
        <label>Font size (points)<div className="text-size"><button aria-label="Decrease font size" onClick={() => update({ fontSize: Math.max(6, selectedBox.fontSize - 1) })}>A−</button><input aria-label="Font size" type="number" min={6} max={144} value={selectedBox.fontSize} onChange={event => { if (Number.isFinite(event.target.valueAsNumber)) update({ fontSize: clamp(event.target.valueAsNumber, 6, 144) }) }} /><button aria-label="Increase font size" onClick={() => update({ fontSize: Math.min(144, selectedBox.fontSize + 1) })}>A＋</button></div></label>
        <div className="text-format-buttons"><button aria-label="Bold" aria-pressed={selectedBox.bold} onClick={() => update({ bold: !selectedBox.bold })}><b>B</b></button><button aria-label="Italic" aria-pressed={selectedBox.italic} onClick={() => update({ italic: !selectedBox.italic })}><i>I</i></button><label>Color<input type="color" aria-label="Text color" value={selectedBox.color} onChange={event => update({ color: event.target.value })} /></label></div>
        <label>Alignment<select aria-label="Text alignment" value={selectedBox.align} onChange={event => update({ align: event.target.value as TextBox['align'] })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
        <div className="text-actions"><button onClick={copyBox}>Copy</button><button onClick={pasteBox} disabled={!clipboard}>Paste</button><button onClick={() => add(selectedBox)}>Duplicate</button><button onClick={remove}>Delete</button></div>
        {layout(selectedBox, pages.find(page => page.id === selectedBox.pageId)!).error && <p className="local-error" role="alert">{layout(selectedBox, pages.find(page => page.id === selectedBox.pageId)!).error}</p>}
      </section> : <p className="local-hint">Select a text box to format it.{clipboard && <button className="local-secondary" onClick={pasteBox}>Paste text box</button>}</p>}
      <details className="text-object-list"><summary>{boxes.length} text {boxes.length === 1 ? 'box' : 'boxes'}</summary>{boxes.map((box, index) => <button key={box.id} aria-pressed={selected === box.id} onClick={() => { setSelected(box.id); setActive(box.pageId); sheets.get(box.pageId)?.scrollIntoView({ block: 'start', behavior: 'instant' }) }}>{index + 1}. {box.text.slice(0, 35) || 'Empty box'} <small>Page {pages.findIndex(page => page.id === box.pageId) + 1}</small></button>)}</details>
      <p className="local-hint">Selected box: Ctrl/⌘ C to copy, V to paste, D to duplicate. Delete to remove; arrows to nudge. Text boxes stay editable until export.</p>
      <button className="local-primary" disabled={busy || !fonts.length || invalid || !boxes.some(box => box.text.trim())} onClick={onExport}>{busy ? 'Creating PDF…' : 'Create PDF'} <span aria-hidden="true">→</span></button>
      <p className="local-hint">Adds new text, not edits to existing PDF text. Standard Latin fonts; unsupported characters or overflowing boxes must be corrected before export.</p>
    </fieldset>{error && <p className="local-error" role="alert">{error}</p>}</aside>
  </div>
}