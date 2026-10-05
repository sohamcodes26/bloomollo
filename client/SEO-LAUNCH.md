# Bloomollo SEO and Google Search Console

## What is deployed by the build

Run `npm run build` and deploy `dist`. The production origin defaults to
https://bloomollo.dpdns.org in site.config.mjs, so it does not depend on a missing
hosting environment variable. SITE_URL can override it for a domain migration.

- dist/sitemap.xml: all public canonical routes, excluding 404.
- dist/robots.txt: crawling allowed and sitemap location advertised.
- dist/image-to-pdf/index.html: server-rendered converter, visible guide,
  unique title/description, self-canonical, social metadata and WebApplication data.
- dist/404.html: noindex, with no canonical to the homepage.

The JPG and image conversion search intents intentionally share the converter URL.
Do not canonicalize this page to the homepage or create thin duplicate JPG pages.
No ranking, rich-result or indexing guarantee is implied.

## Verify your property

1. In Search Console add a URL-prefix property: https://bloomollo.dpdns.org/
2. Choose ONE verification method:
   - HTML file: download Google's exact file and put it in client/public. Rebuild
     and deploy. Alternatively set GOOGLE_SITE_VERIFICATION_FILE to the exact
     googleTOKEN.html filename in your hosting build environment; the build
     generates its standard Google verification content in dist.
   - HTML tag: set GOOGLE_SITE_VERIFICATION to only the token in Google's content
     attribute, in your hosting build environment. Rebuild and deploy.
   - Domain property: use bloomollo.dpdns.org and add Google's exact TXT record
     in DNS if your DNS provider allows it. No HTML file is required for this method.
3. Check the deployed verification file or view-source meta tag, then Verify.
4. Keep the verification file, token or DNS record after verification.

No real Google verification file can be made until Google issues your account's
exact token/filename. Do not use invented or sample tokens.
The .env.example documents build variables; the Node prerender script reads
process.env, NOT local .env files automatically. Set hosting build variables or
PowerShell environment variables before building locally.

## Submit and inspect

1. Open https://bloomollo.dpdns.org/sitemap.xml and /robots.txt after deployment.
   Both must return the actual XML/text, not a fallback HTML page.
2. Search Console > Sitemaps > submit sitemap.xml.
3. URL Inspection > https://bloomollo.dpdns.org/image-to-pdf/
4. Test live URL, inspect rendered content and indexing permission, then Request indexing.
5. Once indexed, check Google's selected canonical equals the converter URL.
6. Review Page indexing, Core Web Vitals and HTTPS reports when data is available.
7. Performance > Search results > add exact Page filter for the converter URL.
   Review queries, impressions, clicks, CTR and average position. Track JPG to PDF,
   image to PDF, PNG to PDF and no-upload conversion queries as hypotheses.

## Follow-up work

- Measure the public page in PageSpeed Insights on mobile and desktop; do not
  assume good Core Web Vitals from a build or a Lighthouse lab score alone.
- Observe real-phone task completion before promoting heavily.
- Earn relevant links to the converter through useful student/teacher resources
  and honest demonstrations; do not buy links or mass-generate keyword pages.
- Use actual Search Console queries to prioritize improvements, not keyword stuffing.
- Treat iLovePDF as a competitor, not a ranking benchmark this patch can guarantee.

Reference documentation:
https://support.google.com/webmasters/answer/9008080
https://support.google.com/webmasters/answer/9012289
https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls