import { useEffect, useRef } from 'react'

// Measured left-iris positions from the actual 1280 × 720 source frames.
// This is a horizontal sweep with holds and reversals, NOT a circular sequence.
const gaze = [313.04, 313.04, 313.24, 313.36, 313.49, 313.59, 315.64,
  324.88, 332.52, 338.28, 339.22, 340.2, 340.51, 337.71, 330.72,
  321.86, 319.61, 319.46, 312.19, 296.07, 281.25, 267.64, 264.66,
  264.97, 274.04, 296.43, 307.11, 309.72, 310.61, 310.56]
const CENTER = 0
// Canonical sweep avoids jumping between duplicate poses on the return journey.
const sweep = [22, 21, 20, 19, 18, CENTER, 6, 7, 8, 9, 10, 11, 12]

export default function CyberneticEyes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: false })
    if (!canvas || !context) return
    let disposed = false
    let raf = 0
    let pointer: { x: number; y: number } | null = null
    let current = gaze[CENTER]
    let drawn = -1
    let previousTime = 0
    let bounds = canvas.getBoundingClientRect()
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    const updateBounds = () => {
      const artwork = canvas.parentElement
      const hero = artwork?.closest('.hero-inner')
      const headline = hero?.querySelector('h1 span')
      if (artwork && hero instanceof HTMLElement && headline) {
        const textBounds = headline.getBoundingClientRect()
        const heroBounds = hero.getBoundingClientRect()
        // Follow the actual headline width, not a viewport-size approximation.
        // Absolute positioning keeps the artwork out of the content flow.
        artwork.style.width = `${textBounds.width}px`
        artwork.style.top = `${textBounds.bottom - heroBounds.top + 8}px`
        // Reserve a deliberate CTA gap independently of the absolute artwork.
        // Scale that clearance with the headline instead of fixed breakpoints.
        hero.style.setProperty('--eyes-height', `${textBounds.width * 360 / 1220}px`)
      }
      bounds = canvas.getBoundingClientRect()
    }
    const onMove = (event: MouseEvent) => { pointer = { x: event.clientX, y: event.clientY } }
    const onLeave = () => { pointer = null }
    const observer = new ResizeObserver(updateBounds)
    observer.observe(canvas)
    const headline = canvas.closest('.hero-inner')?.querySelector('h1')
    if (headline) observer.observe(headline)
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('scroll', updateBounds, { passive: true })
    window.addEventListener('resize', updateBounds, { passive: true })
    window.addEventListener('blur', onLeave)
    document.documentElement.addEventListener('mouseleave', onLeave)

    const images = Array.from({ length: 30 }, (_, index) => {
      const image = new Image()
      image.src = `${import.meta.env.BASE_URL}eye-frames/frame_${String(index).padStart(2, '0')}.webp`
      return image
    })

    // Nothing is rendered or swapped until every source image is decoded.
    Promise.all(images.map(image => image.decode())).then(() => {
      if (disposed) return
      canvas.dataset.ready = 'true'
      updateBounds()
      const render = (time: number) => {
        const dt = previousTime ? Math.min(time - previousTime, 50) : 16.67
        previousTime = time
        let target = gaze[CENTER]
        let centered = true
        if (pointer) {
          const dx = pointer.x - (bounds.left + bounds.width / 2)
          const dy = pointer.y - (bounds.top + bounds.height / 2)
          const distance = Math.hypot(dx, dy)
          const deadZone = Math.max(18, bounds.width * .12)
          if (distance > deadZone) {
            centered = false
            const angle = Math.atan2(dy, dx)
            // Only horizontal gaze exists in this asset. cos(angle) projects
            // the cursor direction onto that supported axis without moving art.
            const direction = Math.cos(angle) * Math.min(1, (distance - deadZone) / 90)
            target += direction * (direction >= 0 ? gaze[12] - gaze[CENTER] : gaze[CENTER] - gaze[22])
          }
        }
        current += (target - current) * (1 - Math.exp(-dt / (reducedMotion.matches ? 55 : 110)))
        let frame = sweep.reduce((best, index) => Math.abs(gaze[index] - current) < Math.abs(gaze[best] - current) ? index : best, CENTER)
        if (centered && Math.abs(current - gaze[CENTER]) < .65) frame = CENTER
        // Small pose hysteresis prevents frame chatter at selection boundaries.
        if (drawn >= 0 && frame !== CENTER && Math.abs(gaze[frame] - current) + .08 >= Math.abs(gaze[drawn] - current)) frame = drawn
        if (frame !== drawn) {
          // Remove the empty upper/lower frame while keeping both eyes and
          // their linework intact. Every gaze uses the exact same crop.
          context.drawImage(images[frame], 30, 210, 1220, 360, 0, 0, 1220, 360)
          drawn = frame
          canvas.dataset.frame = String(frame)
        }
        raf = requestAnimationFrame(render)
      }
      raf = requestAnimationFrame(render)
    }).catch(() => {
      if (!disposed) canvas.dataset.ready = 'error'
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', updateBounds)
      window.removeEventListener('resize', updateBounds)
      window.removeEventListener('blur', onLeave)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <div className="cybernetic-eyes" aria-hidden="true">
    <canvas ref={canvasRef} width="1220" height="360" />
  </div>
}