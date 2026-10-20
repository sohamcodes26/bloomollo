import { useEffect, useMemo, useRef, useState } from 'react'
import type { Settings, WatermarkOptions, WatermarkPosition } from './engine'
import './watermark-controls.css'

type Props = {
  options: WatermarkOptions
  settings: Settings
  pageCount: number
  busy: boolean
  onOptions: (options: WatermarkOptions) => void
  onSettings: (settings: Settings) => void
}

const positions: { value: WatermarkPosition; label: string; x: number; y: number }[] = [
  { value: 'top-left', label: 'Top left', x: 5, y: 5 }, { value: 'top-center', label: 'Top center', x: 35, y: 5 }, { value: 'top-right', label: 'Top right', x: 65, y: 5 },
  { value: 'middle-left', label: 'Middle left', x: 5, y: 44 }, { value: 'center', label: 'Center', x: 35, y: 44 }, { value: 'middle-right', label: 'Middle right', x: 65, y: 44 },
  { value: 'bottom-left', label: 'Bottom left', x: 5, y: 83 }, { value: 'bottom-center', label: 'Bottom center', x: 35, y: 83 }, { value: 'bottom-right', label: 'Bottom right', x: 65, y: 83 },
]

export default function WatermarkControls({ options, settings, pageCount, busy, onOptions, onSettings }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const imageUrl = useMemo(() => options.imageData ? URL.createObjectURL(new Blob([options.imageData.buffer as ArrayBuffer], { type: options.imageType === 'jpg' ? 'image/jpeg' : 'image/png' })) : '', [options.imageData, options.imageType])
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl) }, [imageUrl])
  function setPosition(position: typeof positions[number]) {
    onOptions({ ...options, position: position.value })
    onSettings({ ...settings, x: position.x, y: position.y })
  }
  async function selectImage(file: File | undefined) {
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) { setError('Choose a PNG or JPEG image.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Choose an image smaller than 10 MB.'); return }
    setError('')
    try { onOptions({ ...options, mode: 'image', imageData: new Uint8Array(await file.arrayBuffer()), imageType: file.type === 'image/jpeg' ? 'jpg' : 'png', imageName: file.name }) } catch { setError('Could not read this image. Please choose a different PNG or JPEG.') }
  }
  const page = (value: number) => Math.max(1, Math.min(pageCount, Number.isFinite(value) ? value : 1))
  return <section className="watermark-controls" aria-label="Watermark options">
    <div className="watermark-tabs" role="tablist" aria-label="Watermark type">
      <button type="button" role="tab" aria-selected={options.mode === 'text'} className={options.mode === 'text' ? 'active' : ''} disabled={busy} onClick={() => onOptions({ ...options, mode: 'text' })}><strong>A</strong><span>Place text</span></button>
      <button type="button" role="tab" aria-selected={options.mode === 'image'} className={options.mode === 'image' ? 'active' : ''} disabled={busy} onClick={() => onOptions({ ...options, mode: 'image' })}><strong>▧</strong><span>Place image</span></button>
    </div>
    {options.mode === 'text' ? <>
      <label>Text<textarea rows={2} maxLength={500} value={options.text} onChange={event => onOptions({ ...options, text: event.target.value })} placeholder="Watermark text" /></label>
      <div className="watermark-control-grid"><label>Font<select value={options.fontFamily} onChange={event => onOptions({ ...options, fontFamily: event.target.value as WatermarkOptions['fontFamily'] })}><option value="sans">Helvetica</option><option value="serif">Times Roman</option><option value="mono">Courier</option></select></label><label>Size<input type="number" min={6} max={144} value={options.fontSize} onChange={event => onOptions({ ...options, fontSize: Math.max(6, Math.min(144, event.target.valueAsNumber || 6)) })} /></label></div>
      <div className="watermark-format-row"><button type="button" aria-label="Bold" aria-pressed={options.bold} onClick={() => onOptions({ ...options, bold: !options.bold })}><b>B</b></button><button type="button" aria-label="Italic" aria-pressed={options.italic} onClick={() => onOptions({ ...options, italic: !options.italic })}><i>I</i></button><button type="button" aria-label="Underline" aria-pressed={options.underline} onClick={() => onOptions({ ...options, underline: !options.underline })}><u>U</u></button><label>Color<input type="color" value={options.color} onChange={event => onOptions({ ...options, color: event.target.value })} /></label></div>
    </> : <div className="watermark-image-picker"><input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={event => { void selectImage(event.target.files?.[0]); event.target.value = '' }} /><button type="button" className="watermark-image-button" disabled={busy} onClick={() => input.current?.click()}>{imageUrl ? <img src={imageUrl} alt="Selected watermark" /> : <><strong>＋</strong><span>Choose PNG or JPEG</span></>}</button>{options.imageName && <span className="watermark-file-name" title={options.imageName}>{options.imageName}</span>}</div>}
    <fieldset disabled={busy}><legend>Position</legend><div className="watermark-position-grid">{positions.map(position => <button key={position.value} type="button" aria-label={position.label} aria-pressed={options.position === position.value} className={options.position === position.value ? 'active' : ''} onClick={() => setPosition(position)}><span /></button>)}</div><label className="watermark-checkbox"><input type="checkbox" checked={options.mosaic} onChange={event => onOptions({ ...options, mosaic: event.target.checked })} /> Mosaic</label></fieldset>
    <div className="watermark-control-grid"><label>Transparency<select value={options.opacity} onChange={event => onOptions({ ...options, opacity: Number(event.target.value) })}><option value="1">No transparency</option><option value="0.75">25% transparent</option><option value="0.5">50% transparent</option><option value="0.25">75% transparent</option><option value="0.1">90% transparent</option></select></label><label>Rotation<select value={options.rotation} onChange={event => onOptions({ ...options, rotation: Number(event.target.value) })}><option value="0">Do not rotate</option><option value="45">45°</option><option value="90">90°</option><option value="135">135°</option><option value="180">180°</option><option value="225">225°</option><option value="270">270°</option><option value="315">315°</option></select></label></div>
    <fieldset disabled={busy}><legend>Pages</legend><div className="watermark-pages"><label>From<input type="number" min={1} max={pageCount} value={options.pageStart} onChange={event => onOptions({ ...options, pageStart: Math.min(page(event.target.valueAsNumber), options.pageEnd) })} /></label><span>to</span><label>To<input type="number" min={1} max={pageCount} value={options.pageEnd} onChange={event => onOptions({ ...options, pageEnd: Math.max(page(event.target.valueAsNumber), options.pageStart) })} /></label></div></fieldset>
    <fieldset disabled={busy}><legend>Layer</legend><div className="watermark-layer"><button type="button" className={options.layer === 'over' ? 'active' : ''} aria-pressed={options.layer === 'over'} onClick={() => onOptions({ ...options, layer: 'over' })}><strong>▱</strong><span>Over the PDF content</span></button><button type="button" className={options.layer === 'under' ? 'active' : ''} aria-pressed={options.layer === 'under'} onClick={() => onOptions({ ...options, layer: 'under' })}><strong>▰</strong><span>Below the PDF content</span></button></div></fieldset>
    {options.mode === 'image' && <label>Image width (% of page)<input type="number" min={1} max={90} value={settings.width} onChange={event => { const width = event.target.valueAsNumber; if (Number.isFinite(width)) onSettings({ ...settings, width: Math.max(1, Math.min(90, width)) }) }} /></label>}
    <p className="local-hint">The page preview uses the same PDF watermark as the download. Multiline text is supported; large watermarks are scaled to fit. Standard fonts support Latin text. For other scripts, upload an image. A watermark below content may be hidden by an opaque page background.</p>
    {error && <p className="local-error" role="alert">{error}</p>}
  </section>
}
