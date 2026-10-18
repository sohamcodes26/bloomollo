const tags = new Set('html head body title style main header footer section article aside nav div span p h1 h2 h3 h4 h5 h6 br hr strong em b i u s small sub sup mark blockquote pre code ul ol li dl dt dd table thead tbody tfoot tr th td caption colgroup col img figure figcaption a abbr address time'.split(' '))
const drop = new Set('script iframe frame frameset object embed link meta base template noscript svg math video audio source input button textarea select form'.split(' '))
export function prepareHtml(source: string, size: string, orientation: string, margin: string) {
  if (source.length > 1_000_000) throw new Error('HTML is limited to 1 MB. Use a smaller document.')
  const template = document.createElement('template'); template.innerHTML = source
  const output = document.implementation.createHTMLDocument('Bloomollo document')
  let nodes = 0
  function copy(node: Node, parent: Node, depth: number) {
    if (++nodes > 30000 || depth > 100) throw new Error('This HTML is too complex. Simplify the document and try again.')
    if (node.nodeType === Node.TEXT_NODE) { parent.appendChild(output.createTextNode(node.textContent ?? '')); return }
    if (!(node instanceof HTMLElement) || drop.has(node.localName)) return
    if (!tags.has(node.localName) || ['html', 'head', 'body', 'title'].includes(node.localName)) { for (const child of node.childNodes) copy(child, parent, depth + 1); return }
    const element = output.createElement(node.localName)
    for (const attr of node.attributes) {
      if (['class', 'id', 'style', 'title', 'alt', 'lang', 'dir', 'width', 'height', 'colspan', 'rowspan', 'start', 'reversed', 'scope'].includes(attr.name)) element.setAttribute(attr.name, attr.value)
      if (node.localName === 'img' && attr.name === 'src' && /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(attr.value)) element.setAttribute('src', attr.value)
    }
    parent.appendChild(element)
    for (const child of node.childNodes) copy(child, element, depth + 1)
  }
  for (const child of template.content.childNodes) copy(child, output.body, 0)
  const policy = output.createElement('meta'); policy.httpEquiv = 'Content-Security-Policy'
  policy.content = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
  output.head.prepend(policy)
  const style = output.createElement('style')
  const paper = size === 'letter' ? 'letter' : 'A4', direction = orientation === 'landscape' ? 'landscape' : 'portrait'
  const mm = margin === '0' ? '0' : margin === '20' ? '20' : '12'
  style.textContent = `body{font-family:Georgia,serif;line-height:1.55;color:#202a38;margin:24px}img{max-width:100%}table{border-collapse:collapse;max-width:100%}td,th{padding:6px;border:1px solid #ccc}pre{white-space:pre-wrap;overflow-wrap:anywhere}@page{size:${paper} ${direction};margin:${mm}mm}@media print{html,body{margin:0!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`
  output.body.appendChild(style)
  return '<!DOCTYPE html>' + output.documentElement.outerHTML
}