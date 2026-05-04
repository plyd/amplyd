# Migration `amplyd.vercel.app` → `www.amplyd.com`

Runbook for the day of the DNS swap. No code changes required — everything
listed here is operational.

## Pre-flight

- [ ] CI is green on `main` (web + agent + Playwright `legacy-pdfs.spec.ts`).
- [ ] `https://amplyd.vercel.app/llms.txt` returns 200.
- [ ] `https://amplyd.vercel.app/robots.txt` returns 200 and lists both
      `sitemap.xml` and `llms.txt`.
- [ ] `https://amplyd.vercel.app/sitemap.xml` returns 200 and contains all
      locale routes with `<xhtml:link rel="alternate" hreflang>` entries.
- [ ] `https://amplyd.vercel.app/fr/opengraph-image` returns the 1200×630
      PNG with Vincent's photo.

## DNS (registrar of `amplyd.com`)

- [ ] CNAME `www` → `cname.vercel-dns.com`
- [ ] ALIAS / A record on the apex `@` → `76.76.21.21` (Vercel anycast IP)

## Vercel project

- [ ] `vercel domains add amplyd.com`
- [ ] `vercel domains add www.amplyd.com`
- [ ] In project settings, set `amplyd.com` → 308-redirect to
      `www.amplyd.com`.
- [ ] Wait for the auto-provisioned SSL certificate to be active for both
      hostnames.

## Environment variables (Vercel, production scope)

- [ ] `NEXT_PUBLIC_SITE_URL=https://www.amplyd.com`
- [ ] `AUTH_URL=https://www.amplyd.com` (only if Auth.js is wired through
      `next-auth`).

## Post-flight verification (run from a clean shell)

- [ ] `curl -I https://www.amplyd.com/fr` → 200, `content-type: text/html`.
- [ ] `curl -I "https://www.amplyd.com/these/Valorisation%20du%20b%C3%A9n%C3%A9volat%20sur%20Wikip%C3%A9dia%20-%20FEB2012%20-%20Vincent%20Juhel.pdf"`
      → 200, `content-type: application/pdf`.
- [ ] `curl -I "https://www.amplyd.com/these/Valorisation%20du%20b%C3%A9n%C3%A9volat%20sur%20Wikip%C3%A9dia%20-%20AGWMFR%2027MAI2012.pdf"`
      → 200, `content-type: application/pdf`.
- [ ] `curl https://www.amplyd.com/llms.txt` → 200.
- [ ] `curl https://www.amplyd.com/robots.txt` → 200 and contains
      `Sitemap: https://www.amplyd.com/sitemap.xml`.
- [ ] `curl https://www.amplyd.com/sitemap.xml` → 200 with both `/en/...`
      and `/fr/...` URLs.
- [ ] LinkedIn Post Inspector
      <https://www.linkedin.com/post-inspector/inspect/https%3A%2F%2Fwww.amplyd.com>
      shows the OG image, title and description correctly.
- [ ] Google Rich Results Test on `https://www.amplyd.com/fr` detects the
      `Person` schema with no errors.
- [ ] Submit `https://www.amplyd.com/sitemap.xml` in Google Search Console
      and Bing Webmaster Tools.

## Rollback

If anything is wrong, revert the DNS records to their prior values. Vercel
keeps the old `amplyd.vercel.app` deployment online indefinitely, so the
content remains reachable while debugging.
