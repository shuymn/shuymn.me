import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { DEFAULT_LOCALE, LOCALE_FALLBACK, SUPPORTED_LOCALES } from "./src/lib/i18n";

const runtime = process.env.ASTRO_RUNTIME ?? process.env.EMDASH_RUNTIME ?? "local";
const isCloudflare = runtime === "cloudflare";

export default defineConfig({
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
  adapter: isCloudflare
    ? cloudflare()
    : node({
        mode: "standalone",
      }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["use-sync-external-store/shim/index.js", "use-sync-external-store/shim/with-selector.js"],
    },
  },
  devToolbar: { enabled: false },
});
