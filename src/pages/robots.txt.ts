import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error("Astro site config is required to generate robots.txt.");
  }

  const sitemapUrl = new URL("/sitemap-index.xml", site);

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl.href}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
