import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { brand, products } from './data'
import type { Product } from './data'
import HeroAtmosphere from './components/HeroAtmosphere'
import CyberneticEyes from './components/CyberneticEyes'
import ParticleGlobe from './components/ParticleGlobe'
import ThemeToggle from './components/ThemeToggle'
import './App.css'
import './theme.css'

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">{diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}</svg>
}
function Mark() {
  return <svg className="brand-mark" width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 2 12 7v14l-12 7L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.3" /><path d="m4 9 12 7 12-7M16 16v14m-6-17 12-7m-12 7v14" stroke="currentColor" strokeWidth="1.3" /></svg>
}
function ProductIcon({ slug }: { slug: string }) {
  const paths: Record<string, ReactNode> = {
    debug2ai: <path d="m9 7-5 5 5 5m6-10 5 5-5 5m-2-12-2 14" />,
    'draft-rescue': <><path d="M7 3h8l4 4v14H7V3Zm8 0v5h4M10 12h6m-6 4h4" /><path d="M3 7v14" /></>,
    'page-capture': <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h10v10H7z" />,
    'page-ink': <><path d="m5 15 10-10 4 4L9 19l-6 2 2-6Zm8-8 4 4M4 20l3-3" /><path d="M14 21h7" /></>,
    'video-speed-booster': <path d="m6 5 10 7-10 7V5Zm12 0 4 7-4 7" />,
    'sound-booster': <path d="M3 9h4l5-4v14l-5-4H3V9Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14" />,
  }
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[slug]}</svg>
}
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { element.classList.add('is-visible'); observer.disconnect() }
    }, { threshold: 0.08 })
    element.classList.add('will-reveal'); observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return <div className={`reveal ${className}`} ref={ref} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>{children}</div>
}
function Header({ home }: { home: boolean }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [])
  return <header className="site-header">
    <a className="brand" href="/" aria-label={`${brand} home`}><Mark /><span>{brand}<span className="brand-period">.</span></span></a>
    <nav className="desktop-nav" aria-label="Main navigation"><a href={home ? '#extensions' : '/#extensions'}>The collection <span>06</span></a><a href={home ? '#philosophy' : '/#philosophy'}>Our approach</a><a href={home ? '#faq' : '/#faq'}>Questions</a></nav>
    <ThemeToggle />
    <a href={home ? '#extensions' : '/#extensions'} className="button nav-cta">Explore extensions <span className="button-icon"><Arrow /></span></a>
    <button className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'}><span /><span className={open ? 'open' : ''} /></button>
    <nav id="mobile-menu" aria-label="Mobile navigation" className={`mobile-nav ${open ? 'expanded' : ''}`} inert={!open}><a onClick={() => setOpen(false)} href="/#extensions">The collection <Arrow /></a><a onClick={() => setOpen(false)} href="/#philosophy">Our approach <Arrow /></a><a onClick={() => setOpen(false)} href={home ? '#faq' : '/#faq'}>Questions <Arrow /></a></nav>
  </header>
}
function Footer() {
  return <footer className="site-footer"><div className="footer-top"><a className="brand" href="/"><Mark /><span>{brand}.</span></a><p>Small tools. A little more possibility.</p><a className="text-link" href="/#extensions">Back to the collection <Arrow /></a></div><div className="footer-bottom"><span>© 2026 {brand}. An independent collection.</span><a href="/privacy/">Privacy & transparency</a><span>Made for the everyday web <span className="tiny-star"><Mark /></span></span></div></footer>
}
function ProductPreview({ product }: { product: Product }) {
  const slug = product.slug
  return <div className={`product-preview preview-${slug}`} aria-label={`Illustrative ${product.name} interface preview`}>
    <div className="preview-orbit" /><div className="preview-window">
      <div className="window-top"><span className="window-dots"><i /><i /><i /></span><span>{slug === 'debug2ai' ? 'DEBUG SESSION' : product.name.toUpperCase()}</span><span>↗</span></div>
      {slug === 'debug2ai' && <div className="debug-preview"><div className="preview-status"><i /> Capture complete <span>00:24</span></div><div className="code-line"><span>01</span><code>TypeError: Cannot read properties</code></div><div className="code-line faded"><span>02</span><code>of undefined (reading 'map')</code></div><div className="debug-metrics"><span><b>03</b> Console issues</span><span><b>01</b> Failed requests</span></div><div className="preview-action">AI-ready report <span>Copy report ↗</span></div></div>}
      {slug === 'draft-rescue' && <div className="draft-preview"><div className="draft-label">SAVED TEXT</div><div className="draft-writing">Your saved text<br />appears here<span className="typing-cursor">|</span></div><div className="draft-lines"><i /><i /></div><div className="draft-saved"><span className="check-circle">✓</span><span>Website saved<small>2 text fields · local snapshot</small></span><span>↶</span></div></div>}
      {slug === 'page-capture' && <div className="capture-preview"><div className="capture-sheet"><div className="sheet-label">WEBPAGE CAPTURE</div><div className="sheet-title" /><div className="sheet-columns"><div /><div /></div><div className="sheet-lines"><i /><i /><i /></div><div className="redaction-bar">REDACTED</div></div><div className="crop-corner corner-a" /><div className="crop-corner corner-b" /><div className="capture-formats"><span>PNG</span><span>JPG</span><span>PDF</span></div></div>}
      {slug === 'page-ink' && <div className="ink-preview"><div className="ink-text">Draw and highlight<br /><span>on this webpage.</span></div><svg className="ink-stroke" viewBox="0 0 300 100" fill="none" aria-hidden="true"><path d="M40 65C-5 15 245-4 257 37c15 49-177 62-208 24m202-23 29-7-11 25" stroke="#d7e3b1" strokeWidth="2.5" strokeLinecap="round" /></svg><div className="ink-toolbar"><span>↖</span><span className="selected">✎</span><span>▱</span><span>↶</span><span className="ink-color" /></div></div>}
      {slug === 'video-speed-booster' && <div className="speed-preview"><div className="speed-display">2<span>×</span></div><span className="speed-caption">PLAYBACK SPEED</span><div className="speed-track"><i /><span /></div><div className="speed-presets"><span>1×</span><span className="active">2×</span><span>4×</span><span>8×</span></div></div>}
      {slug === 'sound-booster' && <div className="sound-preview"><div className="waveform">{Array.from({ length: 35 }, (_, i) => <i key={i} style={{ '--bar': `${18 + Math.sin(i * 0.76) ** 2 * 65}%`, '--i': i } as CSSProperties} />)}</div><div className="sound-volume">200<span>%</span><small>TAB VOLUME</small></div><div className="sound-track"><i /><span /></div></div>}
    </div><span className="preview-note">INTERFACE CONCEPT</span>
  </div>
}
function ProductCard({ product, index }: { product: Product; index: number }) {
  return <Reveal delay={(index % 2) * 90} className="product-shell"><a className="product-card" href={`/extensions/${product.slug}/`}><div className="card-meta"><span>{String(index + 1).padStart(2, '0')} / {product.category}</span><span className="product-icon"><ProductIcon slug={product.slug} /></span></div><ProductPreview product={product} /><div className="card-bottom"><div><h3>{product.name}</h3><p>{product.line}</p></div><span className="card-arrow"><Arrow diagonal /></span></div><div className="card-footnote"><span>CHROME EXTENSION</span><span>Discover the tool <Arrow /></span></div></a></Reveal>
}
const generalFaqs = [
  { question: 'Where can I install these extensions?', answer: 'Chrome Web Store links will be added after publication. Each product page currently shows its publication status. The extensions can already be loaded locally by their owner using Chrome’s Load unpacked workflow.' },
  { question: 'Do I need to install the whole collection?', answer: 'No. Each extension is independent. Choose only the tools that are useful to you.' },
  { question: 'Do these tools upload my data?', answer: 'The current builds process their core data locally and do not include accounts or a cloud backend. Read each product’s privacy and compatibility notes; copying a report into another service is your own separate action.' },
  { question: 'Will they work on every website?', answer: 'No extension can promise universal compatibility. Chrome restricts access to browser-protected pages, and individual tools have additional limitations. Each product page explains the important boundaries.' },
]
function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return <div className="faq-list">{items.map((item, i) => <details key={item.question}><summary><span className="faq-number">0{i + 1}</span><span>{item.question}</span><span className="faq-plus">+</span></summary><p>{item.answer}</p></details>)}</div>
}
function Home() {
  const [filter, setFilter] = useState('All tools')
  const categories = ['All tools', 'Developer tools', 'Writing', 'Capture & create', 'Media']
  const filtered = products.filter(p => filter === 'All tools' || p.category === filter)
  return <>
    <section className="hero" aria-labelledby="hero-title"><div className="hero-dots" /><HeroAtmosphere /><div className="hero-inner"><CyberneticEyes /><Reveal><div className="eyebrow"><span className="status-dot" /> INDEPENDENT TOOLS FOR CHROME</div><h1 id="hero-title">A small upgrade.<br /><span>A better everyday.</span></h1><div className="hero-actions"><a href="#extensions" className="button light">Find your next tool <span className="button-icon"><Arrow /></span></a><a href="#philosophy" className="button ghost">A little about us <Arrow diagonal /></a></div></Reveal><div className="hero-bottom"><span>BUILT FOR REAL-LIFE BROWSER MOMENTS</span><a href="#extensions">SCROLL TO EXPLORE <span>↓</span></a></div></div></section>
    <div className="collection-strip"><div><b>06</b><span>Focused extensions</span></div><div><b>One job.</b><span>Done thoughtfully</span></div><div><b>Local-first.</b><span>Your browser, your data</span></div><div><b>Just Chrome.</b><span>No new workspace required</span></div></div>
    <section className="collection section-space" id="extensions"><Reveal><div className="section-kicker"><span>01 — THE COLLECTION</span><span>SMALL TOOLS, REAL DIFFERENCES</span></div><div className="section-heading"><h2>Browse Chrome Extensions</h2></div><div className="filter-row" role="group" aria-label="Filter extensions by category">{categories.map(category => <button key={category} aria-pressed={filter === category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}{category === 'All tools' && <span>06</span>}</button>)}<span className="filter-count" aria-live="polite">{String(filtered.length).padStart(2, '0')} TOOLS</span></div></Reveal><div className="product-grid">{filtered.map(p => <ProductCard key={p.slug} product={p} index={products.indexOf(p)} />)}</div></section>
    <section className="philosophy section-space" id="philosophy"><Reveal><div className="section-kicker"><span>02 — A SIMPLE PHILOSOPHY</span><span>LESS, BUT USEFUL</span></div><div className="philosophy-intro"><span className="large-asterisk"><Mark /></span><h2>The browser is already<br />your workspace.<br /><span>Let’s make it feel like yours.</span></h2></div></Reveal><Reveal><div className="principles"><article><span>01 / FOCUSED</span><h3>One small problem.<br />One good tool.</h3><p>No sprawling dashboards. Each extension has a clear purpose and stays close to it.</p></article><article><span>02 / CONSIDERED</span><h3>Your work stays<br />in your hands.</h3><p>Local processing in the current builds. Clear permissions and honest limitations—not vague promises.</p></article><article><span>03 / EVERYDAY</span><h3>A little less effort.<br />Every single time.</h3><p>Save a few clicks, keep a thought, explain a detail. Small improvements are still improvements.</p></article></div></Reveal></section>
    <section className="globe-section"><div className="globe-heading"><span className="eyebrow">SAME WEB. A LITTLE MORE POSSIBILITY.</span><h2>Make yourself at home.</h2></div><ParticleGlobe /></section>
    <section className="faq-section section-space" id="faq"><Reveal className="faq-layout"><div><h2>FAQs</h2></div><FaqList items={generalFaqs} /></Reveal></section>
    <section className="closing"><Reveal><span className="eyebrow">YOUR NEXT SMALL UPGRADE</span><h2>Less getting in the way.<br /><span>More getting on with it.</span></h2><a href="#extensions" className="button light">Explore the collection <span className="button-icon"><Arrow /></span></a></Reveal><span className="closing-star" aria-hidden="true"><Mark /></span></section>
  </>
}
function StoreButton({ product }: { product: Product }) {
  return product.storeUrl ? <a className="button light" href={product.storeUrl} target="_blank" rel="noopener noreferrer">Add to Chrome <span className="button-icon"><Arrow diagonal /></span></a> : <div className="store-pending"><button className="button light" disabled>Chrome Web Store · Coming soon <span className="button-icon"><Arrow diagonal /></span></button><small>Store link will be added after publication.</small></div>
}
function ProductPage({ product }: { product: Product }) {
  return <>
    <section className="product-hero section-space"><a href="/#extensions" className="back-link">← All extensions</a><div className="product-hero-grid"><Reveal><h1>{product.name}</h1><p>{product.description}</p><StoreButton product={product} /><div className="product-specs"><span>Chrome {product.chrome}</span><span>v{product.version}</span><span>Local processing</span></div></Reveal><Reveal className="detail-preview"><ProductPreview product={product} /><span className="detail-preview-label">Example interface</span></Reveal></div></section>
    <section className="feature-section section-space"><Reveal><div className="section-kicker">01 — WHAT IT DOES</div><h2>What it does</h2><div className="principles">{product.features.map((feature, i) => <article key={feature.title}><span>0{i + 1}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></Reveal></section>
    <section className="how-section section-space"><Reveal className="how-layout"><div><span className="section-kicker">02 — HOW TO USE IT</span><h2>How to use</h2></div><ol className="steps">{product.steps.map((step, i) => <li key={step}><span>0{i + 1}</span><p>{step}</p></li>)}</ol></Reveal></section>
    <section className="notes-section section-space"><Reveal className="notes-grid"><article><span className="section-kicker">YOUR DATA</span><h3>Data and privacy</h3><p>{product.privacy}</p></article><article><span className="section-kicker">THE FINE PRINT, IN PLAIN LANGUAGE</span><h3>Limitations</h3><p>{product.limitations}</p></article></Reveal></section>
    <section className="faq-section section-space" id="product-faq"><Reveal className="faq-layout"><div><span className="section-kicker">03 — QUESTIONS</span><h2>Frequently asked questions</h2></div><FaqList items={product.faqs} /></Reveal></section>
    <section className="product-final"><Reveal><ProductIcon slug={product.slug} /><h2>{product.name}</h2><p>{product.line}</p><StoreButton product={product} /></Reveal></section>
    <section className="related section-space"><div className="section-heading"><h2>More Chrome extensions</h2><a href="/#extensions" className="text-link">See all six <Arrow /></a></div><div className="product-grid">{products.filter(p => p.slug !== product.slug).slice(0, 2).map(p => <ProductCard key={p.slug} product={p} index={products.indexOf(p)} />)}</div></section>
  </>
}
function PrivacyPage() {
  return <section className="legal section-space"><a className="back-link" href="/">← Back home</a><div className="eyebrow">PRIVACY & TRANSPARENCY</div><h1>Clear by design.</h1><p>This collection website has no accounts, advertising trackers, analytics integration, or submission forms. Interactive previews run in your browser and do not access the installed extensions.</p><h2>The website</h2><p>Fonts and site assets are served locally. Your hosting provider may process standard request logs, such as IP addresses, independently of this frontend. Review its policy when the site is deployed.</p><h2>The extensions</h2><p>The current extension builds process their core data locally. They have different permissions, retention behavior, and compatibility boundaries. Read the privacy notes on each product page and the privacy document shipped with each extension before use.</p><h2>You stay in control</h2><p>Downloading captures, exporting drafts, or copying debugging reports gives you a file or clipboard content on your device. Sharing that content with another service is a separate action under that service’s terms. Sensitive-data filtering is not a guarantee.</p><h2>Publication status</h2><p>Chrome Web Store links are not yet configured. Installation buttons remain disabled until the corresponding published URL is added. Publisher contact details and final extension privacy policies must be configured before store publication.</p><p className="legal-date">Last updated: October 1, 2026.</p></section>
}
export default function App({ pathname = '/' }: { pathname?: string }) {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const product = products.find(p => normalized === `/extensions/${p.slug}`)
  const home = normalized === '/'
  return <><a href="#main-content" className="skip-link">Skip to content</a><div className="site-frame"><Header home={home} /><main id="main-content">{home ? <Home /> : product ? <ProductPage product={product} /> : normalized === '/privacy' ? <PrivacyPage /> : <section className="not-found section-space"><span className="eyebrow">404 — NOT IN THE COLLECTION</span><h1>A little off the path.</h1><p>That page isn’t here. The collection is just one click away.</p><a className="button light" href="/">Back to the collection <Arrow /></a></section>}</main><Footer /></div></>
}