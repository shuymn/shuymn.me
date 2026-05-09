import type { CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import { DEFAULT_LOCALE } from "../../lib/i18n";
import { getPostStaticPaths, renderPostMarkdown } from "../../lib/posts";

export const prerender = true;

type Props = {
  post: CollectionEntry<"posts">;
};

export const getStaticPaths = () => getPostStaticPaths(DEFAULT_LOCALE);

export const GET: APIRoute = (context) => renderPostMarkdown((context.props as Props).post);
