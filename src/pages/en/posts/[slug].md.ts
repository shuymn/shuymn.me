import { type CollectionEntry, getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";

export const prerender = true;

type Props = {
  post: CollectionEntry<"posts">;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts", ({ data }) => data.locale === "en");

  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
};

export const GET: APIRoute = (context) => {
  const { post } = context.props as Props;
  const frontmatter = `---\ntitle: ${JSON.stringify(post.data.title)}\n---\n\n`;
  const body = (post.body ?? "").replace(/^\n+/, "");

  return new Response(frontmatter + body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
