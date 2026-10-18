import { useState } from 'react'
import { formatPages } from '../converters/image-to-pdf/format-pages'
import { localTools } from '../converters/local-tools/catalog'
import './tools-hub.css'

const categories = ['All tools', 'Convert to PDF', 'Convert from PDF'] as const
const descriptions: Record<string, string> = {
  JPG: 'Turn photos, receipts and scanned pages into one neatly arranged PDF.',
  PNG: 'Combine screenshots and graphics into a PDF that’s easy to share.',
  WebP: 'Make a PDF from WebP images. No need to change formats first.',
  AVIF: 'Bring AVIF images into a PDF using your browser’s image decoder.',
  BMP: 'Give bitmap images and older scans a more shareable format.',
  GIF: 'Save GIF graphics as still PDF pages. Animation is not preserved.',
}
const tools = [
  { href: '/image-to-pdf/', name: 'Image to PDF', from: 'IMG', to: 'PDF', kind: 'image', category: 'Convert to PDF', description: 'Mix photos, screenshots and scans. Arrange your images and download one PDF.', note: 'Mixed image formats', tone: 'blue' },
  { href: '/tools/jpg-to-pdf/', name: 'JPG to PDF', from: 'JPG', to: 'PDF', kind: 'image', category: 'Convert to PDF', description: descriptions.JPG, note: 'JPG & JPEG supported', tone: 'amber' },
  ...localTools.map(tool => ({ href: `/${tool.slug}/`, name: tool.name, from: tool.from, to: tool.to, kind: tool.from === 'HTML' ? 'code' : 'document', category: tool.from === 'PDF' ? 'Convert from PDF' : 'Convert to PDF', description: tool.from === 'PDF' ? 'Export PDF pages as JPG images. Choose your pages and download individually or as a ZIP.' : 'Preview local HTML, then use your browser’s Print / Save as PDF dialog.', note: tool.from === 'PDF' ? 'Page selection · ZIP download' : 'Browser print workflow', tone: tool.from === 'PDF' ? 'coral' : 'green' })),
  ...formatPages.filter(page => page.label !== 'JPG').map(page => ({ href: `/tools/${page.slug}/`, name: `${page.label} to PDF`, from: page.label, to: 'PDF', kind: 'image', category: 'Convert to PDF', description: descriptions[page.label], note: page.label === 'AVIF' ? 'Browser support required' : page.label === 'GIF' ? 'Still images only' : 'Arrange · Rotate · Export', tone: page.label === 'PNG' ? 'violet' : page.label === 'WebP' ? 'green' : page.label === 'AVIF' ? 'blue' : page.label === 'BMP' ? 'amber' : 'coral' })),
]

function ToolIcon({ kind }: { kind: string }) {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'image' ? <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></> : kind === 'code' ? <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" /> : <><path d="M14 3H5v18h14V8l-5-5Z" /><path d="M14 3v5h5M8 12h8m-8 4h5" /></>}
  </svg>
}

export default function ToolsHub() {
  const [category, setCategory] = useState<typeof categories[number]>('All tools')
  const visibleTools = tools.filter(tool => category === 'All tools' || tool.category === category)
  return <section className="tools-hub" aria-labelledby="tools-title"><div className="tools-shell">
    <nav className="tools-breadcrumb" aria-label="Breadcrumb"><a href="/">Bloomollo</a><span aria-hidden="true">/</span><span aria-current="page">Tools</span></nav>
    <header className="tools-intro"><span className="tools-kicker">SMALL TOOLS. LESS BUSYWORK.</span><h1 id="tools-title">Good tools. <span>For everyday files.</span></h1><p>Make a PDF. Export a page. Get on with your day.<br className="tools-desktop-break" /> Free document tools that work right in your browser.</p><div className="tools-assurances"><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>Files stay on your device</span><span>No account needed</span><span>No watermarks</span></div></header>
    <div className="tools-toolbar"><div className="tools-filters" role="group" aria-label="Filter document tools">{categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}<span>{item === 'All tools' ? tools.length : tools.filter(tool => tool.category === item).length}</span></button>)}</div><span className="tools-count" role="status">{visibleTools.length} tools available</span></div>
    <div className="tools-grid">{visibleTools.map(tool => <a className={`tools-card tools-tone-${tool.tone}`} key={tool.href} href={tool.href}><div className="tools-card-top"><span className="tools-icon"><ToolIcon kind={tool.kind} /></span><span className="tools-conversion">{tool.from}<span aria-hidden="true">→</span>{tool.to}</span></div><h2>{tool.name}</h2><p>{tool.description}</p><div className="tools-card-bottom"><span>{tool.note}</span><span className="tools-card-arrow" aria-hidden="true">↗</span></div></a>)}</div>
    <aside className="tools-notes" aria-labelledby="tools-notes-title"><div><span className="tools-kicker">A LITTLE HELP, IF YOU NEED IT</span><h2 id="tools-notes-title">From files to finished.</h2><p>Image converters support up to 60 images, 25 MB per file and 150 MB per batch. Each image becomes a page; transparency becomes white. No OCR or animation.</p></div><nav aria-label="Conversion guides"><a href="/guides/assignment-photos-to-pdf/">Combine assignment photos <span aria-hidden="true">↗</span></a><a href="/guides/images-to-printable-pdf/">Make a print-ready PDF <span aria-hidden="true">↗</span></a></nav></aside>
  </div></section>
}