# Domain migration: bloomollo.dpdns.org → bloomollo.tech

## Before deploying

1. In the existing Vercel project, add `bloomollo.tech` and `www.bloomollo.tech` under Settings → Domains. Keep `bloomollo.dpdns.org` attached to the same project.
2. At the authoritative DNS provider, add the exact A/CNAME/TXT records Vercel displays. Do not guess IP addresses or delete unrelated MX/TXT records. Wait for Vercel to confirm valid configuration and HTTPS for the new hosts.
3. Change any Vercel `SITE_URL` environment variable to `https://bloomollo.tech` for the production build. An old environment value overrides `site.config.mjs`. Redeploy after changing it.
4. Verify ownership of both domains in Google Search Console. Preserve the old verification method. Use DNS verification for the new Domain property, or update the GOOGLE_SITE_VERIFICATION / GOOGLE_SITE_VERIFICATION_FILE environment variables for a URL-prefix property as appropriate.
5. Deploy this migration only when the new domain is ready. Permanent redirects are cached; do not enable them before the destination works. Review the other local PDF-tool changes before deploying this working tree.

## Redirect behavior

The host-specific permanent redirects in `vercel.json` send old-domain requests to the same path on the new domain and consolidate www onto the apex domain. The legacy `/tools/image-to-pdf/` route goes directly to `/image-to-pdf/` on the new host. Existing new-domain route redirects remain unchanged. Keep the old domain's DNS, HTTPS, and Vercel assignment working for at least one year, preferably longer.

Do not configure an additional conflicting dashboard redirect. If the old domain is served by a different project or provider, equivalent redirects must be configured there; this file only affects this deployment.

## After deploying

- Check the homepage and several deep links on both hosts, with query strings. Old URLs must permanently redirect to the correct new pages, not all to the homepage. Confirm no loops, broken assets, or unexpected redirect chains.
- Check canonical, Open Graph, JSON-LD, and hreflang URLs in rendered source. Check `/robots.txt` and `/sitemap.xml` reference only the new domain.
- Submit the new sitemap in Search Console and use Change of Address on the old property after redirects pass checks. Monitor indexing, traffic and 404s on both properties; temporary search visibility fluctuations are possible.
- Update external profile links, extension store listings, analytics configuration, and any third-party domain allowlists separately where applicable. These account changes are not made by the repository.
- Browser storage and service workers are origin-scoped: the new domain does not automatically inherit old preferences, stored browser data, or installed PWA state. Do not promise users their local state has migrated.

## References

- Vercel custom domains: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Vercel redirects configuration: https://vercel.com/docs/project-configuration/vercel-json
- Google site moves: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes