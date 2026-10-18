export async function loadHtmlUrl(value: string, signal: AbortSignal) {
  let url: URL
  try { url = new URL(value.trim()) } catch { throw new Error('Enter a complete URL, such as https://example.com/page.html.') }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP or HTTPS URL without a username or password.')
  const response = await fetch(url.href, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
  if (!response.ok) throw new Error(`The website returned HTTP ${response.status}. Try another URL or upload a saved HTML file.`)
  const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if (type !== 'text/html' && type !== 'application/xhtml+xml') throw new Error('This URL did not return an HTML document.')
  const limit = 1_000_000
  if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); throw new Error('Choose an HTML document smaller than 1 MB.') }
  if (!response.body) throw new Error('This URL returned an empty document.')
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let bytes = 0, html = ''
  try {
    while (true) {
      const { done, value: chunk } = await reader.read()
      if (done) break
      bytes += chunk.byteLength
      if (bytes > limit) { await reader.cancel(); throw new Error('Choose an HTML document smaller than 1 MB.') }
      html += decoder.decode(chunk, { stream: true })
    }
    html += decoder.decode()
  } finally { reader.releaseLock() }
  if (!html.trim()) throw new Error('This URL returned an empty document.')
  return html
}