import { useSyncExternalStore } from 'react'

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#ffffff' : '#090a09')
  window.dispatchEvent(new Event('themechange'))
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== 'bloomollo-theme' && event.key !== null) return
    applyTheme(event.newValue === 'dark' ? 'dark' : 'light')
  }
  window.addEventListener('themechange', onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('themechange', onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme || 'light', () => 'light')
  const light = theme === 'light'
  const label = `Switch to ${light ? 'dark' : 'light'} mode`
  return <button className="theme-toggle" type="button" aria-label={label} title={label} aria-pressed={light} onClick={() => {
    const next = light ? 'dark' : 'light'
    applyTheme(next)
    try { localStorage.setItem('bloomollo-theme', next) } catch { /* Keep the in-memory preference. */ }
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      {light ? <path d="M20.5 14.5A9 9 0 0 1 9.5 3.5a9 9 0 1 0 11 11Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>}
    </svg>
    <span>{light ? 'Dark' : 'Light'}</span>
  </button>
}