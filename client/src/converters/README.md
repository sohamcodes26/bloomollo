# Browser conversion tools

Each tool lives in its own folder with UI, styles, a pure model, and a worker when needed. Routes are registered in `src/App.tsx` and `src/entry-server.tsx` for prerendering and sitemap generation.

## Image to PDF

- Route: `/tools/image-to-pdf/`
- `model.ts`: format signatures, limits, reorder helper and PDF geometry.
- `ImageToPdfPage.tsx`: accessible controls, file import and small thumbnail generation, object URL ownership, worker lifecycle and download.
- `pdf.worker.ts`: sequential decoding, rotation, white transparency background, quality resizing and JPEG encoding, PDF generation with pdf-lib. No uploads or remote resources.
- `image-to-pdf.css`: scoped high-contrast light workspace, independent of the saved site theme.

Limits: 60 files, 25 MB per file, 150 MB per batch, 40 megapixels per decoded image. These are guardrails, not guarantees against device memory exhaustion. PNG and common JPEG dimensions are checked before decoding using a bounded header read; other formats and JPEGs with unusually large headers are checked after decoding. Large or malicious compressed files can still consume memory. Supported signatures: JPEG, PNG, WebP, GIF, BMP, AVIF. Actual decoding is browser-dependent. HEIC, TIFF, SVG, RAW and PSD are explicitly excluded. Animated formats yield a still frame. Output is rasterized JPEG (even high quality is not lossless); no OCR or metadata-preservation guarantee.

The PDF engine is bundled in a separate worker chunk and loaded when conversion starts. Import creates bounded-size previews rather than leaving full-resolution decoded images in the page. Conversion is sequential, bitmaps are closed, object URLs are released on removal/unmount, and cancellation terminates the worker. Reloading intentionally clears files. Do not add file-upload analytics or external decoders without revisiting privacy claims.

Run `npm run build`, `npm run lint`, `npm test`. For live conversion checks start `npm run preview -- --host 127.0.0.1`, launch Chromium with remote debugging on port 9333, then run `node scripts/converter-browser-check.mjs`.