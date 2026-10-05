import { formatPages } from '../converters/image-to-pdf/format-pages'
import './tools-hub.css'

export default function ToolsHub() {
  return <section className="tools-hub section-space" aria-labelledby="tools-title">
    <nav className="back-link" aria-label="Breadcrumb"><a href="/">Bloomollo</a><span aria-hidden="true"> / </span><span aria-current="page">Tools</span></nav>
    <header className="tools-intro"><span className="eyebrow">BROWSER TOOLS — NO INSTALL NEEDED</span><h1 id="tools-title">Your files.<br />A little more useful.</h1><p>Free image-to-PDF tools that process your files on your device. Choose a format, arrange your pages and download one document without an account or watermark.</p></header>
    <a className="tools-feature" href="/tools/image-to-pdf/"><span className="eyebrow">START HERE · MIXED IMAGE FORMATS</span><h2>Image to PDF <span aria-hidden="true">↗</span></h2><p>Combine photos, screenshots and scans in one PDF. Reorder and rotate pages, then choose A4, US Letter or Fit to image.</p><span className="tools-open">Open converter <span aria-hidden="true">→</span></span></a>
    <section aria-labelledby="format-tools-title"><div className="section-heading"><h2 id="format-tools-title">Choose your image format</h2></div><div className="tools-format-grid">{formatPages.map(page => <a className="tools-format" key={page.slug} href={`/tools/${page.slug}/`}><span className="eyebrow">{page.label}</span><h3>{page.label} to PDF <span aria-hidden="true">↗</span></h3><p>{page.description}</p><span className="tools-open">Open converter</span></a>)}</div></section>
    <aside className="tools-notes"><h2>Before you convert</h2><p>Each image becomes one PDF page. Up to 60 images, 25 MB per file and 150 MB per batch. Browser decoding support varies by format. Transparency becomes white; animations become still images. This is not an OCR tool.</p><nav aria-label="Conversion guides"><a href="/guides/assignment-photos-to-pdf/">Combine assignment photos</a><a href="/guides/images-to-printable-pdf/">Make printable A4 or US Letter PDFs</a></nav></aside>
  </section>
}