import { Suspense } from 'react'
import PdfToJpg from './PdfToJpg'
import HtmlToPdf from './HtmlToPdf'
import BrandWordmark from '../../components/BrandWordmark'
import LegalFooter from '../../components/LegalFooter'
import type { localTools } from './catalog'
import './local-tools.css'
import './html-flow.css'
export default function LocalToolPage({ tool }: { tool: typeof localTools[number] }) {
  return <><a href="#main-content" className="skip-link">Skip to content</a><main id="main-content" className={`local-tool ${tool.slug === 'html-to-pdf' ? 'html-tool-page' : ''}`} >
    <header className="local-toolbar"><a href="/" aria-label="Bloomollo home"><BrandWordmark /></a><a href="/tools/">All tools ↗</a><span><i /> Files stay on your device</span></header>
    <nav className="local-breadcrumb" aria-label="Breadcrumb"><a href="/tools/">Tools</a> / <span aria-current="page">{tool.name}</span></nav>
    <header className="local-intro"><h1>{tool.name}</h1><p>{tool.description}</p></header>
    <Suspense fallback={<p role="status">Loading converter?</p>}>{tool.slug === 'pdf-to-jpg' ? <PdfToJpg /> : <HtmlToPdf />}</Suspense>
    <nav className="local-related" aria-label="Related tools"><a href="/image-to-pdf/">Image to PDF ↗</a><a href="/tools/jpg-to-pdf/">JPG to PDF ↗</a><a href={tool.slug === 'pdf-to-jpg' ? '/html-to-pdf/' : '/pdf-to-jpg/'}>{tool.slug === 'pdf-to-jpg' ? 'HTML to PDF' : 'PDF to JPG'} ↗</a></nav>
  </main><LegalFooter variant="tool" /></>
}
