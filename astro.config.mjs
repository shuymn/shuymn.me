import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import react from "@astrojs/react";
import { access, cloudflareCache, d1, r2 } from "@emdash-cms/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { DEFAULT_LOCALE, LOCALE_FALLBACK, SUPPORTED_LOCALES } from "./src/lib/i18n";

const runtime = process.env.EMDASH_RUNTIME ?? "local";
const isCloudflare = runtime === "cloudflare";
const accessTeamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
const defaultAccessRole = 50;
const accessDefaultRole = Number(process.env.EMDASH_ACCESS_DEFAULT_ROLE ?? defaultAccessRole);

if (isCloudflare && !accessTeamDomain) {
  throw new Error("CF_ACCESS_TEAM_DOMAIN is required when EMDASH_RUNTIME=cloudflare.");
}

if (!Number.isInteger(accessDefaultRole)) {
  throw new Error("EMDASH_ACCESS_DEFAULT_ROLE must be an integer role level.");
}

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
  experimental: isCloudflare
    ? {
        cache: {
          // Deploy setup must provide nodejs_compat plus CF_ZONE_ID and
          // CF_CACHE_PURGE_TOKEN so EmDash tag invalidation can purge edge cache.
          provider: cloudflareCache(),
        },
      }
    : {},
  integrations: [
    react(),
    emdash(
      isCloudflare
        ? {
            database: d1({ binding: "DB", session: "auto" }),
            storage: r2({ binding: "MEDIA" }),
            auth: access({
              teamDomain: accessTeamDomain,
              audienceEnvVar: "CF_ACCESS_AUDIENCE",
              // Access policy owns the outer allowlist; matching users become EmDash admins by default.
              defaultRole: accessDefaultRole,
            }),
          }
        : {
            database: sqlite({ url: "file:./data.db" }),
            storage: local({
              directory: "./uploads",
              baseUrl: "/_emdash/api/media/file",
            }),
          },
    ),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["use-sync-external-store/shim/index.js", "use-sync-external-store/shim/with-selector.js"],
    },
  },
  devToolbar: { enabled: false },
});
