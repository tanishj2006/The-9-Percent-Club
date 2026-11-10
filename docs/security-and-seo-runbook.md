# Security and SEO runbook

How the site's security headers, indexing rules and checks fit together, and
what to do when something changes. The findings behind each item are in
`docs/audit-2026-11.md`.

## Where things live

| Thing | File | Notes |
|---|---|---|
| Security headers, CSP | `next.config.ts` | Applied to every path by `headers()` |
| `X-Powered-By` off | `next.config.ts` | `poweredByHeader: false` |
| Preview noindex | `src/lib/site.ts` (`INDEXABLE`) | Read by `robots.ts`, the locale layout's metadata, and `next.config.ts` (`X-Robots-Tag`) |
| robots.txt | `src/app/robots.ts` | Production allows all; previews disallow all |
| Sitemap | `src/app/sitemap.ts` | 26 URLs with hreflang alternates |
| hreflang | `src/lib/site.ts` → `languageAlternates()` | In page HTML only. The middleware's `Link` header is off (`alternateLinks: false` in `src/i18n/routing.ts`) |
| JSON-LD | `src/components/SiteJsonLd.tsx` | Person + WebSite only. No dates until a visible "last reviewed" date exists |
| security.txt | `src/app/.well-known/security.txt/route.ts` | Expires 180 days after each deploy |
| Manifest | `src/app/manifest.ts` | |
| theme-color | `viewport` export in `src/app/[locale]/layout.tsx` | Light and dark `--bg` |

## The Content Security Policy

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self';
worker-src 'self'; upgrade-insecure-requests
```

Why `'unsafe-inline'` for scripts: Next.js streams page data in inline scripts
(about 290 distinct ones across the site) and next-themes sets the theme with
another. Hashes would have to be regenerated for every content change, and a
nonce forces every page to render per request, which would end static
generation. The site has no user input, and no third-party scripts, so the practical
risk is low. The two `dangerouslySetInnerHTML` uses are the JSON-LD (built
from constants, `<` escaped) and the Support page's QR code (an SVG string the
`qrcode` library builds at build time from the env-validated UPI ID).
**Never add `'unsafe-eval'`.**

### Adding a third-party resource

Everything is same-origin today: fonts are self-hosted by `next/font`, Vercel
Analytics posts to `/_vercel/insights` on this origin. If you add anything
from another origin (an embed, a font CDN, Speed Insights from a different
host), add that origin to the narrowest directive that covers it, then run:

```bash
NEXT_DIST_DIR=.next-csp npm run build && NEXT_DIST_DIR=.next-csp npx next start -p 3107
# open every page, scroll it, and check the console for "Content Security Policy"
```

and delete `.next-csp` afterwards.

## Previews must not be indexed

`VERCEL_ENV` is `production`, `preview` or `development` on Vercel and unset
elsewhere. Anything other than `production` gets:

- `robots.txt`: `Disallow: /`, no sitemap
- `<meta name="robots" content="noindex, nofollow">` from the locale layout
- `X-Robots-Tag: noindex, nofollow` on every response

Builds outside Vercel behave like production so tests check the real thing.
`src/app/robots.test.ts` covers the four cases.

## Environment variables

| Variable | Scope on Vercel | Sensitive? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production | No. Public by design |
| `NEXT_PUBLIC_UPI_ID` | **Production only** | No (a UPI ID is meant to be shared) but it should not appear on previews, and it is never committed |
| `NEXT_PUBLIC_UPI_NAME` | **Production only** | No |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | Production, if you use meta-tag verification | Not secret, but kept out of the repo |

Everything prefixed `NEXT_PUBLIC_` is compiled into the browser bundle. Never
put a token, key or password in one. `.env*` is ignored by git.

If you choose meta-tag verification for Search Console or Bing, read the values
in the locale layout's `generateMetadata` as
`verification: { google: process.env.GOOGLE_SITE_VERIFICATION, other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION ?? [] } }`.
DNS verification needs no code at all and is preferable.

## Checks that run automatically

| Workflow | When | What fails it |
|---|---|---|
| `.github/workflows/ci.yml` | Push to main, every PR | Lint, vitest, `next build`, Playwright |
| `.github/workflows/security.yml` | Push, PR, Mondays 09:00 IST | A critical advisory in shipped deps; any secret in git history |
| `.github/workflows/lighthouse.yml` | Every PR | Mobile a11y < 95, best practices < 95, SEO < 90, CLS > 0.1 (performance, LCP and TBT warn only) |
| `.github/dependabot.yml` | Mondays | Opens grouped minor/patch PRs; majors separately |

All actions are pinned to commit SHAs with the tag in a comment. Dependabot
updates the SHA and the comment together. No workflow needs a secret, and every
one runs with `permissions: contents: read`.

`e2e/no-js.spec.ts` checks what a crawler without JavaScript receives. Its
`test.fixme` block lists key figures that exist only inside the animated
scenes; turn each into a real test as the chapter starts rendering it as text.

## Recurring tasks

| Every | Task |
|---|---|
| Deploy | security.txt `Expires` resets to deploy date + 180 days. Deploy at least once every six months |
| Week | Merge or close Dependabot PRs |
| 4 weeks | Run the 20 queries in `docs/ai-visibility-log.md` and log the results |
| Union Budget, or an exchange or SEBI circular on charges | Regenerate `data/cost-reference.json` from `nse-backtester`, update `src/lib/costs.ts`, run `npm test`, and update each chapter's "last reviewed" date once that exists |
| Quarter | Re-run Lighthouse on the live site via PageSpeed Insights; compare with the scorecard in the latest audit |

## If a secret is committed

1. Revoke or rotate it first. Removing it from git does not un-leak it.
2. Then rewrite history (`git filter-repo`) and force-push, and ask GitHub
   support to purge cached views if the repo is public.
3. Run `gitleaks git .` to confirm.
