import { brand } from '../data'
import './legal-footer.css'
import { translator } from '../converters/image-to-pdf/locales'
import type { Locale } from '../converters/image-to-pdf/locales'

export default function LegalFooter({ variant = 'site', locale = 'en' }: { variant?: 'site' | 'tool'; locale?: Locale }) {
  const t = translator(locale)
  return <footer className={`legal-footer legal-footer--${variant}`} aria-label="Copyright and legal information">
    <span>© {new Date().getFullYear()} {brand}. {t("All rights reserved.")}</span>
    <nav aria-label="Legal"><a href="/terms/">{t("Terms of Service")}</a><a href="/privacy/">{t("Privacy Policy")}</a></nav>
  </footer>
}