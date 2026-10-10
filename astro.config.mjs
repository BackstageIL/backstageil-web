// @ts-check
import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Public URL of the site (canonical links, sitemap, language alternates). backstageil.com
// redirects here (Vercel domain settings).
const site = process.env.SITE_URL ?? "https://www.backstageil.com";

// https://astro.build/config
export default defineConfig({
  site,
  // Static site: every page is built from the API at build time (the API triggers a rebuild
  // after admin changes), so visitors never call the API.
  output: "static",
  integrations: [
    react(),
    // Each page listed with its other-language version (hreflang alternates)
    sitemap({ i18n: { defaultLocale: "en", locales: { en: "en", he: "he" } } }),
  ],
  // English at the plain URLs, Hebrew under /he/
  i18n: {
    defaultLocale: "en",
    locales: ["en", "he"],
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
