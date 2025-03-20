import { getAllPostsSortByDate } from '@/lib/posts'
import About from './_components/About'
import PostLink from './_components/PostLink'

export default function Page() {
  const posts = getAllPostsSortByDate()

  return (
    <main>
      <About />
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
  )
}
