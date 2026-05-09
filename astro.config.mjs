import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { DEFAULT_LOCALE, LOCALE_FALLBACK, SUPPORTED_LOCALES } from "./src/lib/i18n";
import { SITE_URL } from "./src/lib/seo";

export default defineConfig({
  site: SITE_URL,
  output: "server",
  trailingSlash: "never",
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: SUPPORTED_LOCALES,
    fallback: LOCALE_FALLBACK,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  adapter: cloudflare({
    imageService: "compile",
  }),
  integrations: [
    react(),
    sitemap({
      filter: (page) => !new URL(page).pathname.endsWith("/404"),
      namespaces: {
        news: false,
        xhtml: false,
        image: false,
        video: false,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["use-sync-external-store/shim/index.js", "use-sync-external-store/shim/with-selector.js"],
    },
  },
  devToolbar: { enabled: false },
});
