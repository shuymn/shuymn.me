import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import Link from 'next/link'
import type React from 'react'
import { Layout } from 'src/components/Layout'
import type { Post } from 'src/lib/posts'
import { getAllPostsSortByDate } from 'src/lib/posts'

export const getStaticProps: GetStaticProps<{
  posts: Post[]
}> = async () => {
  const posts = await getAllPostsSortByDate()
  return { props: { posts } }
}

const About: React.FC = () => {
  return (
    <section className="mt-8 mb-16">
      <div className="text-lg">
        <p>
          日常的なことやプログラミングに関する個人的な記事を投稿しています。
        </p>
        <p>投稿は全て個人の意見であり、所属する組織の意見ではありません。</p>
        <p>お問い合わせの際は、下記のリンク先からご連絡ください。</p>
      </div>
      <ul className="mt-4 flex space-x-2">
        <li>
          <a href="https://twitter.com/shuymn" className="no-underline text-blue-600 visited:text-purple-600 cursor-pointer">Twitter</a>
        </li>
        <li>/</li>
        <li>
          <a href="https://github.com/shuymn" className="no-underline text-blue-600 visited:text-purple-600 cursor-pointer">GitHub</a>
        </li>
        <li>/</li>
        <li>
          <a href="mailto:mail@shuymn.me" className="no-underline text-blue-600 visited:text-purple-600 cursor-pointer">mail</a>
        </li>
      </ul>
    </section>
  )
}

const PostLink: React.FC<{
  props: { slug: string; date: string; title: string }
}> = ({ props: { slug, date, title } }) => {
  return (
    <div className="mb-6">
      <p className="text-sm text-gray-800">{date.replace(/-/g, '.')}</p>
      <Link href={`/posts/${slug}`} className="text-xl no-underline text-blue-600 visited:text-purple-600 cursor-pointer">
        {title}
      </Link>
    </div>
  )
}

const IndexPage = ({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Layout
      props={{ title: '', description: 'shuymn.me', slug: '', cardImage: '' }}
    >
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
    </Layout>
  )
}

export default IndexPage
