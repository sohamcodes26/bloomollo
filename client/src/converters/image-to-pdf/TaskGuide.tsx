import { taskGuides } from './task-guides'

export default function TaskGuide({ guide }: { guide: typeof taskGuides[number] }) {
  return <section className="pdf-guide" aria-labelledby="task-guide-title">
    <nav aria-label="Breadcrumb"><a href="/">Bloomollo</a> / <a href="/tools/image-to-pdf/">Image to PDF</a> / Guide</nav>
    <header><h1 id="task-guide-title">{guide.title}</h1><p>{guide.description}</p><a href="/tools/image-to-pdf/">Open the free Image to PDF converter →</a></header>
    <div className="pdf-guide-columns">{guide.steps.map(([heading, text], index) => <article key={heading}><h2>{index + 1}. {heading}</h2><p>{text}</p></article>)}</div>
    <p>Files are processed locally in your browser. Batch limits: 60 images, 25 MB per image, 150 MB total and 40 megapixels per image. Browser decoding support and available memory can affect conversion.</p>
    <nav aria-label="Related guides">{taskGuides.filter(item => item.slug !== guide.slug).map(item => <p key={item.slug}><a href={`/guides/${item.slug}/`}>{item.title}</a></p>)}</nav>
  </section>
}