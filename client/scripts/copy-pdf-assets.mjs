import { cp, mkdir } from 'node:fs/promises'
for (const directory of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  const target = new URL(`../public/pdfjs/${directory}/`, import.meta.url)
  await mkdir(target, { recursive: true })
  await cp(new URL(`../node_modules/pdfjs-dist/${directory}/`, import.meta.url), target, { recursive: true })
}
console.log('Copied local PDF.js fonts, character maps and decoders.')