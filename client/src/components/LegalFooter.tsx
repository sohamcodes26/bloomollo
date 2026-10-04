import { brand } from '../data'
import './legal-footer.css'

export default function LegalFooter({ variant = 'site' }: { variant?: 'site' | 'tool' }) {
  return <footer className={`legal-footer legal-footer--${variant}`} aria-label="Copyright and legal information">
    <span>© {new Date().getFullYear()} {brand}. All rights reserved.</span>
    <nav aria-label="Legal"><a href="/terms/">Terms of Service</a><a href="/privacy/">Privacy Policy</a></nav>
  </footer>
}