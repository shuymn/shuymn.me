import type { APIRoute } from "astro";
import { SITE_URL } from "../lib/seo";

export const prerender = true;

export const GET: APIRoute = () => {
  const sitemapUrl = new URL("/sitemap-index.xml", SITE_URL).href;

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
