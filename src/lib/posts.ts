import { type CollectionEntry, getCollection } from "astro:content";
import type { Locale } from "./i18n";

export async function getPostStaticPaths(locale: Locale) {
  const posts = await getCollection("posts", ({ data }) => data.locale === locale);
  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
}

export function renderPostMarkdown(post: CollectionEntry<"posts">): Response {
  const frontmatter = `---\ntitle: ${JSON.stringify(post.data.title)}\n---\n\n`;
  const body = (post.body ?? "").replace(/^\n+/, "");
  return new Response(frontmatter + body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
