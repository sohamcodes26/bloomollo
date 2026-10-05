# Bloomollo

**A small upgrade. A better everyday.**

Bloomollo is a browser-utility website with a local-processing image-to-PDF converter. This repository contains the React website, converter, translations, practical guides and static rendering pipeline.

- Website: https://bloomollo.dpdns.org/
- Converter: https://bloomollo.dpdns.org/tools/image-to-pdf/
- Repository: https://github.com/sohamcodes26/bloomollo

## Features

- Combine JPG/JPEG, PNG, WebP, GIF, BMP and AVIF into one PDF, subject to browser decoding support.
- Process images locally with a Web Worker and OffscreenCanvas, without uploading them to a conversion server.
- Reorder images with desktop/touch dragging or arrow buttons, rotate previews and remove images.
- Choose A4, US Letter or fit-to-image pages, orientation, margins, quality and filename.
- Generate and initiate a download in one action, without an account or watermark.
- English, Hindi, German, French and Spanish interfaces, with format-specific pages and practical guides.

Chrome-extension product listings are also included. Listings do not imply that extension implementations or published store packages are included in this repository.

## Limits and privacy

Up to 60 images, 25 MB per image, 150 MB per batch and 40 megapixels per image. Available device memory can impose lower practical limits.

The output is image-based: no OCR, selectable-text generation or lossless conversion. Transparency becomes white, animated images become still images, and High quality remains compressed.

Local conversion does not eliminate ordinary network requests for website assets or hosting request metadata. Never submit personal documents in issues or pull requests; use synthetic samples.

## Development

Use Node.js 22.12 or later in the Node 22 release line, or another version supported by the installed Vite version, and npm.

```sh
git clone https://github.com/sohamcodes26/bloomollo.git
cd bloomollo/client
npm ci
npm run dev
```

Open the address printed by Vite and visit `/tools/image-to-pdf/`. Cloning requires the repository to be public or your account to have access.

## Build and validation

Run from `client/`:

```sh
npm run build
npm run lint
npm test
npm run preview
```

Build before testing: website and SEO checks read generated files in `dist/`. The build type-checks, builds browser/server bundles, prerenders routes, generates sitemap and robots files, and generates an asset cache. Deploy `client/dist/`.

Additional browser-check scripts under `client/scripts/` require a running preview server and a Chromium remote-debugging session. They are not part of `npm test`; consult each script for setup and ports.

## Structure

```text
client/
  src/converters/image-to-pdf/  Converter, worker, translations and guides
  src/components/              Shared interface components
  src/App.tsx                  Website and route selection
  src/entry-server.tsx         Static rendering and page metadata
  scripts/                     Build generation and validation
  public/                      Fonts, icons and static assets
  site.config.mjs              Production origin
  vercel.json                  Deployment configuration
```

## Deployment configuration

The default origin is in `client/site.config.mjs`. The prerender script reads optional build-process variables:

- `SITE_URL`: deployment origin for canonical URLs and sitemap.
- `GOOGLE_SITE_VERIFICATION`: Search Console HTML-tag token.
- `GOOGLE_SITE_VERIFICATION_FILE`: exact Google verification filename.

See `client/.env.example` and `client/SEO-LAUNCH.md`. Set variables in the hosting build environment; the standalone Node prerender script does not automatically load `.env`. Never commit API keys or account credentials.

## Contributing

Contributions are welcome for browser compatibility, accessibility, performance, native-speaker translation review and reproducible tests.

1. Open an issue explaining the problem or proposal.
2. Keep pull requests focused and document behavior changes.
3. Add/update tests and run build, lint and tests.
4. Include desktop/mobile screenshots and browser testing notes for UI changes.

Bug reports should include browser/version, device, steps and a non-sensitive sample where needed. For potential vulnerabilities, contact the maintainer privately through an available private channel rather than publishing exploit details. A dedicated security contact is not yet documented.

## Technology

React, TypeScript, Vite and `pdf-lib`, with browser-native Web Workers, OffscreenCanvas and image decoding. End-user conversion does not require an OpenAI API integration.

## License and status

This is an early-stage project; no verified adoption statistics are claimed here. Translations need native-speaker review.

Bloomollo's original project code and documentation are licensed under the [MIT License](./LICENSE). The license permits reuse, modification and distribution, including commercial use, provided the copyright and permission notice are retained. The software is supplied without warranty.

Third-party dependencies and assets retain their own licenses, including font notices in `client/public/fonts/`. The project license does not replace those terms. Maintainers must have the necessary rights to code and assets they contribute; adding a license does not establish ownership of third-party material.