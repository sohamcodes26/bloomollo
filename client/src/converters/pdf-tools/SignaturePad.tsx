import { useRef } from 'react'
export default function SignaturePad({ onChange }: { onChange: (bytes: Uint8Array) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), drawing = useRef(false)
  function save() { const data = canvas.current!.toDataURL('image/png').split(',')[1]; onChange(Uint8Array.from(atob(data), c => c.charCodeAt(0))) }
  return <div className="signature-pad"><p>Draw your signature or upload a PNG below.</p><canvas ref={canvas} width={600} height={180} aria-label="Draw signature with pointer; alternatively upload a PNG" onPointerDown={event => {
    event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true
    const rect = event.currentTarget.getBoundingClientRect(), ctx = event.currentTarget.getContext('2d')!
    ctx.beginPath(); ctx.moveTo((event.clientX - rect.left) * 600 / rect.width, (event.clientY - rect.top) * 180 / rect.height)
  }} onPointerMove={event => {
    if (!drawing.current) return
    const rect = event.currentTarget.getBoundingClientRect(), ctx = event.currentTarget.getContext('2d')!
    ctx.strokeStyle = '#142333'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.lineTo((event.clientX - rect.left) * 600 / rect.width, (event.clientY - rect.top) * 180 / rect.height); ctx.stroke()
  }} onPointerUp={() => { drawing.current = false; save() }} onPointerCancel={() => { drawing.current = false }} />
    <button type="button" className="local-secondary" onClick={() => { canvas.current!.getContext('2d')!.clearRect(0, 0, 600, 180); onChange(new Uint8Array()) }}>Clear signature</button>
  </div>
}