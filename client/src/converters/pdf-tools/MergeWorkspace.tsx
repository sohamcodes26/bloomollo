import { useState } from 'react'
import type { DragEvent } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PageItem } from './engine'
import './merge-workspace.css'

type Source = { name: string; doc: PDFDocumentProxy }
type Props = {
  sources: Source[]
  pages: PageItem[]
  order: number[]
  busy: boolean
  onOrder: (order: number[]) => void
}

function reorder(order: number[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return order
  const next = [...order]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export default function MergeWorkspace({ sources, pages, order, busy, onOrder }: Props) {
  const [dragging, setDragging] = useState<number | null>(null)
  const visibleOrder = order.length ? order : sources.map((_, index) => index)

  function drop(event: DragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault()
    const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
    if (Number.isInteger(sourceIndex)) onOrder(reorder(visibleOrder, sourceIndex, targetIndex))
    setDragging(null)
  }

  return <section className="merge-workspace" aria-label="PDF merge order">
    <div className="merge-workspace-intro">
      <div><strong>PDF order</strong><span>{sources.length} files · {pages.length} pages</span></div>
      <p>Drag and drop the files to choose the order of the merged PDF. Each card represents one PDF.</p>
    </div>
    <div className="merge-file-grid">
      {visibleOrder.map((sourceIndex, orderIndex) => {
        const source = sources[sourceIndex]
        const preview = pages.find(page => page.file === sourceIndex)
        if (!source) return null
        return <article
          key={`${sourceIndex}-${source.name}`}
          className={`merge-file-card${dragging === orderIndex ? ' is-dragging' : ''}`}
          draggable={!busy}
          onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(orderIndex)); setDragging(orderIndex) }}
          onDragOver={event => event.preventDefault()}
          onDrop={event => drop(event, orderIndex)}
          onDragEnd={() => setDragging(null)}
        >
          <div className="merge-file-card-top"><span className="merge-file-order">{String(orderIndex + 1).padStart(2, '0')}</span><span className="merge-drag-hint" aria-hidden="true">⋮⋮</span></div>
          <div className="merge-file-preview">{preview ? <img src={preview.thumbnail} alt={`First page of ${source.name}`} draggable={false} /> : <span aria-hidden="true">PDF</span>}</div>
          <div className="merge-file-details"><strong title={source.name}>{source.name}</strong><span>{source.doc.numPages} {source.doc.numPages === 1 ? 'page' : 'pages'}</span></div>
          <div className="merge-file-actions">
            <button type="button" disabled={busy || orderIndex === 0} aria-label={`Move ${source.name} earlier`} onClick={() => onOrder(reorder(visibleOrder, orderIndex, orderIndex - 1))}>←</button>
            <button type="button" disabled={busy || orderIndex === visibleOrder.length - 1} aria-label={`Move ${source.name} later`} onClick={() => onOrder(reorder(visibleOrder, orderIndex, orderIndex + 1))}>→</button>
          </div>
        </article>
      })}
    </div>
  </section>
}
