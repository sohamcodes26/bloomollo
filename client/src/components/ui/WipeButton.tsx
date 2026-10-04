import type { ButtonHTMLAttributes } from 'react'
import './wipe-button.css'

export default function WipeButton({ children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`wipe-button ${className}`} {...props}><span>{children}</span></button>
}