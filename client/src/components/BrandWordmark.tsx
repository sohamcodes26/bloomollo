import { brand } from '../data'
import './brand-wordmark.css'

export default function BrandWordmark({ className = '' }: { className?: string }) {
  return <span className={`brand-wordmark ${className}`}>{brand}<span className="brand-period">.</span><sup className="brand-trademark" aria-label="trademark">™</sup></span>
}