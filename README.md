# BackstageIL Web

Website for BackstageIL: technical information about performance venues and halls in Israel, for
technicians, stage managers and production crews.

## How it works

- [Astro](https://astro.build) with React components. Every venue and hall page is built to
  plain HTML from the [BackstageIL API](https://github.com/BackstageIL/backstageil-api) at build
  time; visitors never call the API.
- Hosted on Vercel (static). The API triggers a rebuild through a Vercel deploy hook after every
  admin change, so the site shows new data about 1-2 minutes later.
- English first; every UI string goes through i18n so Hebrew can be added later.

## Develop

Requires Node 24 (see `.nvmrc`).

```bash
npm ci                 # install (locked)
npm run dev            # http://localhost:4321, reads the production API by default
npm run build          # build every page into dist/
npm run preview        # serve the built site
npm run check          # type check (astro check)
npm run lint           # ESLint
npm run format         # Prettier (format:check in CI)
npm test               # unit tests (Vitest)
npm run gen:api        # regenerate src/lib/api-types.ts from the API's OpenAPI schema
```

Settings (all optional, see `.env.example`): `API_URL`, `SITE_URL`, `PUBLIC_CONTACT_EMAIL`.
