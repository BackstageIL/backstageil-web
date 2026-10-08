# backstageil-web

Website for BackstageIL: technical information about performance venues and halls in Israel.
Astro 7 (static output) + React components + Tailwind CSS 4, TypeScript strict, Node 24, npm.
Hosted on Vercel; data from the BackstageIL API at build time only.

## Commands

```bash
npm ci                # install (locked)
npm run dev           # dev server, reads the production API (API_URL to override)
npm run build         # build all pages from the API (fails loudly if the API fails)
npm run check && npm run lint && npm run format:check && npm test   # what CI runs, plus build
npm run gen:api       # regenerate src/lib/api-types.ts after API schema changes (commit it)
```

## Layout and conventions

- `src/pages/` routes (file = URL); dynamic routes use `getStaticPaths()` from the API.
- `src/lib/api.ts` typed, memoized, retrying API client (testable without Astro);
  `src/lib/site-api.ts` the instance for this build (`API_URL` from `astro:env`).
- `src/lib/api-types.ts` is generated from the API's OpenAPI schema: never edit by hand.
- React only where the page needs interactivity (islands with `client:*`); everything else is
  `.astro` rendered to HTML at build time.
- Every UI string through i18n (English first, Hebrew later): no hard-coded copy in components.
  Use logical CSS (`ms-`/`pe-`/`start`/`end`) so RTL works later.
- Mobile-first (used backstage on phones); light/dark follows the device.
- Content is neutral facts from the API; the site never stores or shows personal contact
  details. The only contact address is the project email (`PUBLIC_CONTACT_EMAIL`).
- Every behavior change comes with tests (Vitest for `src/lib`).

## Way of work

1. Every change has a Jira ticket in project **BSIL**.
2. Branch `usr/uriel_s/BSIL-XXX` from an up-to-date `main`; commits and PR titles start with `BSIL-XXX:`.
3. Test before push: check, lint, format:check, test and build must pass; the PR says how it was tested.
4. `main` is protected: PR only, the `ci` check must pass, squash merge.

## Confidential info never goes into this repo

`.env` files, tokens and the Vercel deploy hook URL stay out of the repo (Vercel/GitHub settings
only). Only `.env.example` with variable names is committed. gitleaks runs in CI.
