export function parsePages(input: string, count: number): number[] {
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Open a valid PDF first.')
  if (!input.trim()) {
    if (count > 100) throw new Error('Export up to 100 pages at a time. Choose a smaller page range.')
    return Array.from({ length: count }, (_, i) => i + 1)
  }
  const pages = new Set<number>()
  for (const part of input.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!match) throw new Error('Use page numbers or ranges, for example 1, 3-5.')
    const start = Number(match[1]), end = Number(match[2] ?? match[1])
    if (start < 1 || end > count || end < start) throw new Error(`Choose pages between 1 and ${count}, with ranges in ascending order.`)
    if (end - start >= 100) throw new Error('Export up to 100 pages at a time. Choose a smaller page range.')
    for (let page = start; page <= end; page++) {
      pages.add(page)
      if (pages.size > 100) throw new Error('Export up to 100 pages at a time. Choose a smaller page range.')
    }
  }
  return [...pages].sort((a, b) => a - b)
}
export function safeFilename(name: string) { return name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 70) || 'bloomollo' }
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}