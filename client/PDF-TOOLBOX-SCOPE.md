# PDF toolbox delivery

Branch: `feature/pdf-toolbox`. All processing is local; no server or new dependency was added.

## Implemented screenshot entries

| Tool | Scope |
| --- | --- |
| Merge PDF | Combine files, reorder/rotate pages, export PDF. |
| Split PDF | One PDF per page or semicolon-separated page groups, ZIP output. |
| Remove pages | Selected pages removed; at least one page must remain. |
| Extract pages | Selected pages exported together. |
| Organize PDF | Combine, reorder, rotate, delete pages. |
| Scan to PDF | Existing image workspace with mobile camera input; no OCR, edge detection or perspective correction. |
| Compress PDF | Rasterizes all pages at 72/96/144 DPI; text and interactive content are lost. Smaller size is not guaranteed. |
| JPG to PDF | Existing image converter retained. |
| HTML to PDF | Existing URL/file/paste import, editable HTML, safe preview and browser print flow retained. |
| PDF to JPG | Existing resolution, quality, page range and ZIP workflow retained. |
| Rotate PDF | Individual pages or selected-page rotation in 90-degree steps. |
| Add page numbers | Bottom-center sequential numbering with font size and starting number. |
| Add watermark | Text or PNG/JPEG image, font formatting, color, 3×3 positioning, mosaic repeat, transparency, rotation, page range and over/under layer controls. Downloads the watermarked PDF directly. |
| Crop PDF | Uniform edge inset; crop box only, not secure removal. |
| Edit PDF | Explicitly labeled Add text to PDF: overlays only; no existing-content editing. |
| PDF Forms | Existing AcroForm text, checkbox, dropdown, option list (single selection), radio fields; optional flattening. No XFA or form creation. |
| Sign PDF | Draw signature or upload PNG, position on selected pages. Visual signature, not a certificate-based signature. |
| Redact PDF | One percentage-based rectangle on selected pages; rebuilds ALL pages as images, dropping source text, forms, links and metadata. Review every page. |
| Compare PDF | Manual, independently scrolling side-by-side page images. No automatic difference detection. |
| PDF to Markdown | Selectable text with page headings and basic Markdown escaping. No OCR, inferred semantic layout or table reconstruction. |

## Not implemented

| Tool | Reason |
| --- | --- |
| Repair PDF | No robust corruption-repair engine available in the existing stack. |
| OCR PDF | Needs an OCR engine, language assets and searchable-text reconstruction. |
| Word to PDF | Needs faithful Office document layout/rendering. |
| PowerPoint to PDF | Needs slide rendering, fonts, shapes and chart support. |
| Excel to PDF | Needs spreadsheet layout/print-area rendering. |
| PDF to Word | Needs layout reconstruction and editable document generation; OCR for scans. |
| PDF to PowerPoint | No PowerPoint writer or editable slide reconstruction in the stack. |
| PDF to Excel | Needs table detection/reconstruction and spreadsheet generation. |
| PDF to PDF/A | Needs archival conversion, font embedding and conformance validation. |
| Unlock PDF | No supported decryption-and-rewrite implementation; never bypasses encryption. Existing PDF-to-JPG can render password-protected PDFs with the correct password. |
| Protect PDF | Existing PDF writer does not supply supported PDF encryption. |
| AI Summarizer | No local language model/runtime; remote AI would change the local-only privacy promise. |
| Translate PDF | No local translation/layout engine; remote translation would upload content. |

## Additional retained tools

Image to PDF and dedicated PNG, WebP, AVIF, BMP and GIF routes. GIF is a still frame; AVIF decoding depends on browser support.

## Shared limits

New PDF workspaces: 10 files, 50 MB/file, 100 MB combined, 100 pages total. Comparison: two files. Single-document operations: one file. Encrypted and XFA files are rejected. Existing forms are flattened by page-copy tools; bookmarks, attachments, document-level metadata and accessibility structure are not preserved. Existing digital signatures are invalidated. Standard-font overlays may reject unsupported characters. Modified PDFs have a review preview and a separate download action.

## Validation

- `npm run build`
- `npm run lint`
- `npm test` (includes PDF toolbox engine and all-route checks)
- `node scripts/pdf-toolbox-browser-check.mjs` with preview on port 4173 and a debug browser on port 9333
- `node scripts/html-preview-browser-check.mjs` for HTML workflow regressions
