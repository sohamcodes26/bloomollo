import { useEffect, useRef, useState } from 'react'

/** Original Canvas implementation: Fibonacci sphere, depth projection and pointer repulsion. */
export default function ParticleGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resetRef = useRef<(() => void) | null>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0, height = 0, rotation = 0, tilt = -0.13, frame = 0, lastTime = 0
    let visible = true, dragging = false, lastX = 0, lastY = 0
    const pointer = { x: -10000, y: -10000 }
    const count = window.innerWidth < 768 ? 1600 : 3400
    const points = Array.from({ length: count }, (_, i) => {
      const y = 1 - (i / (count - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = Math.PI * (3 - Math.sqrt(5)) * i
      return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r, dx: 0, dy: 0 }
    })
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width; height = bounds.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr; canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.67 || 1, 2)
      lastTime = time
      if (visible && !document.hidden) {
        ctx.clearRect(0, 0, width, height)
        if (!dragging && !pausedRef.current && !reducedMotion.matches) rotation += 0.0015 * delta
        const radius = Math.min(width * 0.37, height * 0.57)
        const cx = width / 2, cy = height * 0.56
        const sin = Math.sin(rotation), cos = Math.cos(rotation)
        const st = Math.sin(tilt), ct = Math.cos(tilt)
        for (const p of points) {
          const x = p.x * cos + p.z * sin
          const z = p.z * cos - p.x * sin
          const y = p.y * ct - z * st
          const depth = p.y * st + z * ct
          const perspective = 3 / (3 - depth * 0.45)
          const px = cx + x * radius * perspective, py = cy + y * radius * perspective
          const dx = px - pointer.x, dy = py - pointer.y
          const distance = Math.hypot(dx, dy)
          const influence = !reducedMotion.matches && depth > -0.2 ? Math.max(0, 1 - distance / 110) : 0
          const force = influence * influence * 62
          p.dx += ((dx / (distance || 1)) * force - p.dx) * 0.1 * delta
          p.dy += ((dy / (distance || 1)) * force - p.dy) * 0.1 * delta
          const alpha = 0.14 + ((depth + 1) / 2) * 0.76
          ctx.fillStyle = `rgba(235,237,228,${alpha})`
          ctx.beginPath()
          ctx.arc(px + p.dx, py + p.dy, (0.65 + ((depth + 1) / 2) * 1.05) * perspective, 0, Math.PI * 2)
          ctx.fill()
        }
        if (pointer.x > 0 && !reducedMotion.matches) {
          ctx.strokeStyle = 'rgba(225,230,206,0.3)'; ctx.lineWidth = 0.7
          ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 34, 0, Math.PI * 2); ctx.stroke()
        }
      }
      frame = requestAnimationFrame(draw)
    }
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top
      if (dragging) {
        rotation += (event.clientX - lastX) * 0.006
        tilt = Math.max(-0.85, Math.min(0.85, tilt + (event.clientY - lastY) * 0.003))
      }
      lastX = event.clientX; lastY = event.clientY
    }
    const down = (event: PointerEvent) => {
      dragging = true; lastX = event.clientX; lastY = event.clientY
      canvas.setPointerCapture(event.pointerId)
    }
    const up = () => { dragging = false }
    const leave = () => { pointer.x = -10000; pointer.y = -10000 }
    const key = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      if (event.key === 'ArrowLeft') rotation -= 0.15
      if (event.key === 'ArrowRight') rotation += 0.15
      if (event.key === 'ArrowUp') tilt = Math.max(-0.85, tilt - 0.1)
      if (event.key === 'ArrowDown') tilt = Math.min(0.85, tilt + 0.1)
    }
    resetRef.current = () => { rotation = 0; tilt = -0.13; leave() }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    observer.observe(canvas)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('pointerleave', leave); canvas.addEventListener('keydown', key)
    resize(); frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect()
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('keydown', key)
      resetRef.current = null
    }
  }, [])

  return <div className="globe-stage">
    <div className="globe-halo" />
    <canvas ref={canvasRef} tabIndex={0} role="img" aria-label="Interactive particle globe. Drag or use arrow keys to rotate. Hover to gently displace the particles." />
    <div className="globe-caption"><span><i /> A little room to play.</span><span>DRAG TO ROTATE · HOVER TO EXPLORE</span></div>
    <div className="globe-controls"><button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Resume rotation' : 'Pause rotation'}</button><button onClick={() => resetRef.current?.()}>Reset</button></div>
  </div>
}