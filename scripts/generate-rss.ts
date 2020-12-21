import { writeFileSync } from "fs";
import RSS from "rss";
import { getAllPostsSortByDate } from "src/lib/posts";

const HOST_NAME = process.env.NEXT_PUBLIC_HOST_NAME;

(async () => {
  if (!HOST_NAME) {
    throw new Error("host name is not resolved");
  }

  const feed = new RSS({
    title: "shuymn.me",
    site_url: HOST_NAME,
    feed_url: `${HOST_NAME}/feed.xml`,
  });

  const posts = await getAllPostsSortByDate();
  posts.map((post) => {
    feed.item({
      title: post.meta.title,
      description: post.meta.description,
      guid: post.slug,
      url: `${HOST_NAME}/posts/${post.slug}`,
      date: new Date(post.meta.date).toString(),
      author: "shuymn",
    });
  });

  const rss = feed.xml({ indent: true });
  writeFileSync("./.next/static/feed.xml", rss);
})();
