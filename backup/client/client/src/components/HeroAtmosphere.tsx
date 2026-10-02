import type { CSSProperties } from 'react'

export default function HeroAtmosphere() {
  return <>
    <div className="corner-glare glare-left" aria-hidden="true"><div className="glare-bloom" />{Array.from({ length: 28 }, (_, i) => <span className="glare-spark" key={i} style={{
      '--spark-x': `${8 + ((i * 37) % 88)}%`,
      '--spark-y': `${4 + ((i * 23) % 77)}%`,
      '--spark-delay': `${-i * 0.73}s`,
      '--spark-duration': `${3.8 + (i % 5) * 0.61}s`,
    } as CSSProperties} />)}</div>
    <div className="corner-glare glare-right" aria-hidden="true"><div className="glare-bloom" />{Array.from({ length: 28 }, (_, i) => <span className="glare-spark" key={i} style={{
      '--spark-x': `${8 + ((i * 31) % 88)}%`,
      '--spark-y': `${4 + ((i * 41) % 77)}%`,
      '--spark-delay': `${-i * 0.91 - 1.7}s`,
      '--spark-duration': `${4.1 + (i % 5) * 0.57}s`,
    } as CSSProperties} />)}</div>
    <div className="perspective-grid interactive-floor" aria-hidden="true">
      {Array.from({ length: 216 }, (_, i) => <div className="floor-tile" key={i} />)}
    </div>
  </>
}