import { getAllPostsSortByDate } from '@/lib/posts'
import About from './_components/About'
import PostLink from './_components/PostLink'

export default function Page() {
  const posts = getAllPostsSortByDate()

  return (
    <main>
      <About />
      <hr className="my-8 h-1 border-gray-300" />
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
