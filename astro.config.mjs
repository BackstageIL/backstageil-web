// @ts-check
import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Public URL of the site (canonical links, sitemap). Set SITE_URL in Vercel once the domain exists.
const site = process.env.SITE_URL ?? "https://backstageil-web.vercel.app";

// https://astro.build/config
export default defineConfig({
  site,
  // Static site: every page is built from the API at build time (the API triggers a rebuild
  // after admin changes), so visitors never call the API.
  output: "static",
  integrations: [react(), sitemap()],
  // English first; Hebrew (BSIL-34) is added as another locale with a /he/ prefix.
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    routing: { prefixDefaultLocale: false },
  },
  env: {
    schema: {
      API_URL: envField.string({
        context: "server",
        access: "public",
        url: true,
        default: "https://backstageil-api.vercel.app",
      }),
      PUBLIC_CONTACT_EMAIL: envField.string({
        context: "client",
        access: "public",
        default: "urielsa@elementostage.com",
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
