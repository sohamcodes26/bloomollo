import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Option<T extends string> = { value: T; label: string }

export default function PdfSelect<T extends string>({ label, value, options, disabled = false, onChange }: {
  label: string
  value: T
  options: Option<T>[]
  disabled?: boolean
  onChange: (value: T) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 240 })
  const expanded = open && !disabled
  const selected = Math.max(0, options.findIndex(option => option.value === value))
  useLayoutEffect(() => {
    if (!expanded) return
    function place() {
      const trigger = triggerRef.current
      const list = listRef.current
      if (!trigger || !list) return
      const rect = trigger.getBoundingClientRect()
      const below = Math.max(0, window.innerHeight - rect.bottom - 13)
      const above = Math.max(0, rect.top - 13)
      const upwards = below < Math.min(list.scrollHeight, 240) && above > below
      const maxHeight = Math.min(240, upwards ? above : below)
      const height = Math.min(list.scrollHeight + 2, maxHeight)
      const width = Math.min(rect.width, window.innerWidth - 16)
      setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: upwards ? rect.top - height - 5 : rect.bottom + 5, width, maxHeight })
    }
    function outside(event: PointerEvent) {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false)
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('pointerdown', outside)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('pointerdown', outside)
    }
  }, [expanded])
  useLayoutEffect(() => {
    if (expanded) listRef.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' })
  }, [active, expanded])
  function choose(index: number) { onChange(options[index].value); setOpen(false) }
  return <div className="pdf-select" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !listRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
  }}>
    <span id={`${id}-label`} className="pdf-select-label">{label}</span>
    <button ref={triggerRef} type="button" className="pdf-select-trigger" role="combobox" disabled={disabled}
      aria-labelledby={`${id}-label ${id}-value`} aria-expanded={expanded} aria-haspopup="listbox"
      aria-controls={expanded ? `${id}-list` : undefined}
      aria-activedescendant={expanded ? `${id}-option-${active}` : undefined}
      onClick={() => { setActive(selected); setOpen(!expanded) }}
      onKeyDown={event => {
        if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); setOpen(false); return }
        if (event.key === 'Tab') { setOpen(false); return }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          setActive(expanded ? (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length : selected)
          setOpen(true)
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault(); setActive(event.key === 'Home' ? 0 : options.length - 1); setOpen(true)
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (expanded) choose(active)
          else { setActive(selected); setOpen(true) }
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const match = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()))
          if (match >= 0) { event.preventDefault(); setActive(match); setOpen(true) }
        }
      }}><span id={`${id}-value`}>{options[selected].label}</span><span aria-hidden="true">⌄</span></button>
    {expanded && createPortal(<div ref={listRef} id={`${id}-list`} className="pdf-select-list" role="listbox" aria-labelledby={`${id}-label`}
      style={{ ...position, visibility: position.width ? 'visible' : 'hidden' }}>
      {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option"
        aria-selected={option.value === value} className={index === active ? 'is-active' : undefined}
        onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()}
        onClick={() => choose(index)}>{option.label}<span aria-hidden="true">{option.value === value ? '✓' : ''}</span></div>)}
    </div>, document.body)}
  </div>
}