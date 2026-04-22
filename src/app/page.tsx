import { getAllPostsSortByDate } from "@/lib/posts";
import About from "./_components/About";
import PostLink from "./_components/PostLink";

export default function Page() {
  const posts = getAllPostsSortByDate();

  return (
    <main>
      <section className="mt-8 mb-8" aria-label="プロフィールとサイトについて">
        <About />
      </section>
      <hr className="my-8 h-1 border-border" />
      <section>
        {posts.map((post) => (
          <PostLink
            key={post.slug}
            props={{
              slug: post.slug,
              date: post.meta.date,
              title: post.meta.title,
            }}
          />
        ))}
      </section>
    </main>
  );
}
