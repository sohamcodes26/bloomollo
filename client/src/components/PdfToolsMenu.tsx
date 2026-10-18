import { useEffect, useId, useRef, useState } from 'react'
import { pdfMenuGroups, pdfMenuLinks } from '../converters/pdf-tools/catalog'
import './pdf-tools-menu.css'

export default function PdfToolsMenu() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null), button = useRef<HTMLButtonElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); button.current?.focus() } }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  return <div className="pdf-menu" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button ref={button} type="button" className="pdf-menu-trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>All PDF tools <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={open ? 'm4 10 4-4 4 4' : 'm4 6 4 4 4-4'} /></svg></button>
    <nav className="pdf-mega" id={id} hidden={!open} aria-label="All PDF tools"><div className="pdf-mega-heading"><strong>PDF tools</strong><a href="/tools/">Browse all tools ↗</a></div><div className="pdf-mega-grid">{pdfMenuGroups.map((group, index) => <section key={group} className={`pdf-menu-group pdf-menu-group-${index}`}><h2>{group}</h2>{pdfMenuLinks.filter(link => link.group === group).map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}><span aria-hidden="true">{link.mark}</span>{link.name}</a>)}</section>)}</div><p className="pdf-mega-note">Local processing. No account required. Only available tools are listed.</p></nav>
  </div>
}