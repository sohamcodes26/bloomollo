import { useEffect, useRef } from 'react'

export default function Cube() {
  const stage = useRef<HTMLDivElement>(null)
  const cube = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const parent = stage.current?.closest('.hero')
    if (!parent || !cube.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let targetX = -22, targetY = 32, currentX = -22, currentY = 32, frame = 0
    const move = (e: Event) => {
      const event = e as PointerEvent
      const rect = parent.getBoundingClientRect()
      targetX = -22 - ((event.clientY - rect.top) / rect.height - 0.5) * 35
      targetY = 32 + ((event.clientX - rect.left) / rect.width - 0.5) * 65
      if (!frame) frame = requestAnimationFrame(animate)
    }
    const leave = () => { targetX = -22; targetY = 32; if (!frame) frame = requestAnimationFrame(animate) }
    const animate = () => {
      currentX += (targetX - currentX) * 0.065; currentY += (targetY - currentY) * 0.065
      if (cube.current) cube.current.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`
      frame = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.01 ? requestAnimationFrame(animate) : 0
    }
    parent.addEventListener('pointermove', move); parent.addEventListener('pointerleave', leave)
    return () => { cancelAnimationFrame(frame); parent.removeEventListener('pointermove', move); parent.removeEventListener('pointerleave', leave) }
  }, [])
  return <div className="cube-stage" ref={stage} aria-hidden="true"><div className="cube-aura" /><div className="cube" ref={cube}>{['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => <div className={`cube-face ${face}`} key={face}><span className="cube-symbol">✳</span></div>)}</div><span className="cube-orbit orbit-one" /><span className="cube-orbit orbit-two" /></div>
}