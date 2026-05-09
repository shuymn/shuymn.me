import type { CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import { getPostStaticPaths, renderPostMarkdown } from "../../../lib/posts";

export const prerender = true;

type Props = {
  post: CollectionEntry<"posts">;
};

export const getStaticPaths = () => getPostStaticPaths("en");

export const GET: APIRoute = (context) => renderPostMarkdown((context.props as Props).post);
