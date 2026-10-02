# Bloomollo — extension collection

Bloomollo is an editable working brand, not a claim of an established publisher.
The site is built in the existing React + TypeScript + Vite setup. No additional
runtime libraries were installed. The six extension folders were not modified.

## Run locally (PowerShell)

```powershell
Set-Location -LiteralPath 'C:\Users\soham\OneDrive\Desktop\New folder\Extensions UI\client'
npm run dev
```

For the production version with prerendered page metadata:

```powershell
npm run build
npm run preview
```

## Pages

- `/` — landing page, category filters, twinkling corner glare, interactive floor tiles, globe, approach, FAQs.
- `/extensions/debug2ai/`
- `/extensions/draft-rescue/`
- `/extensions/page-capture/`
- `/extensions/page-ink/`
- `/extensions/video-speed-booster/`
- `/extensions/sound-booster/`
- `/privacy/` — website transparency; not a substitute for each extension’s policy.
- `/404.html` — custom not-found content; configure your host to return HTTP 404.

## Add the store links and edit copy

Edit `C:\Users\soham\OneDrive\Desktop\New folder\Extensions UI\client\src\data.ts`.
Change each product’s `storeUrl` from `null` to its published Chrome Web Store URL.
Installation controls automatically become real external links. Until then they
are disabled and clearly labelled Coming soon. Names, descriptions, steps,
features, compatibility notes, FAQs, versions, and the brand live in this file.

The cards use illustrative HTML/CSS interface concepts, explicitly labelled as
such, rather than actual screenshots. Replace them if you want exact popup images.
The hero atmosphere and Canvas particle globe are original implementations, not copied
third-party code. Manrope is hosted locally under the bundled SIL Open Font License.

## SEO and deployment

`npm run build` renders full HTML for every page, then React hydrates the page for
interactivity. Each product has its own title, description, Open Graph/Twitter
text metadata, one H1, semantic features, visible FAQs, internal links, and
SoftwareApplication JSON-LD. No invented reviews, pricing, or aggregate ratings.

Set the real public origin before the production build:

```powershell
$env:SITE_URL = 'https://YOUR-REAL-DOMAIN'
npm run build
```

This enables canonical URLs, a sitemap, and the sitemap reference in robots.txt.
Without SITE_URL, domain-dependent tags are intentionally omitted. Use your real
domain, not the example above. Add a raster social-sharing image before launch if
you want image previews; this build supplies text metadata only.

Upload `C:\Users\soham\OneDrive\Desktop\New folder\Extensions UI\client\dist`
to a static host. Serve each directory’s index.html for its trailing-slash URL.
No backend or history-fallback rewrite is required for the known static pages.
Ensure unknown URLs use 404.html with a 404 status, not a homepage rewrite.
The app expects deployment at the domain root, not under a subfolder.

Prerendering is an SEO foundation, not a promise of rankings. Publisher details,
final extension policies, real store listings, search research, and live-domain
indexing checks still need to be completed before public launch.

## Interaction and accessibility

- The hero supporting paragraph is replaced by a small rotating 3D wireframe cube
  matching the brand mark. Decorative star symbols also use the cube brand mark.
- Upper-left and upper-right glints twinkle at staggered intervals.
- Perspective floor tiles light on hover, hold for 140 ms after leaving, then fade over 850 ms.
- Globe rotates automatically; hover repels particles; pointer dragging rotates it.
- Globe uses 9,500 particles on desktop and 3,800 on mobile. Drag-release velocity
  decays with time-based friction, settling into automatic rotation rather than stopping abruptly.
- Focus the globe and use arrow keys for keyboard rotation.
- Pause/resume and Reset controls are available.
- Reduced-motion preference stops automatic globe rotation and pointer repulsion,
  logo rotation, corner twinkling, inertia, scroll reveals, smooth scrolling, and waveform animation.
- Globe drawing is skipped while offscreen or the document is hidden.
- Mobile navigation supports Escape, expanded state, and inactive-menu inertness.
- FAQ disclosures are native keyboard-accessible details/summary elements.

## Validation

```powershell
npm run build
npm run lint
npm test
```

Browser checks use Chromium’s debugging protocol without a browser-test dependency.
Start the production preview on port 4173 and a Chromium browser with remote
debugging on port 9333, then run:

```powershell
node 'C:\Users\soham\OneDrive\Desktop\New folder\Extensions UI\client\scripts\browser-check.mjs'
```

The browser check validates layout overflow, filters, removal of the hero cube,
corner glare, cube branding, real floor hover and delayed fade, dense globe
rendering/drag/inertia/pause, six product routes, unavailable store buttons, mobile
menu, FAQs, font availability, and console/hydration errors. Screenshots are saved
to `C:\Users\soham\OneDrive\Desktop\New folder\Extensions UI\client\checks`.