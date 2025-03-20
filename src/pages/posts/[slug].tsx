import 'katex/dist/katex.min.css'
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next'
import type React from 'react'
import { Layout } from 'src/components/Layout'
import { markdownToHtml } from 'src/lib/markdown'
import { type Post, getAllPosts, getPostBySlug } from 'src/lib/posts'
import tw from 'twin.macro'

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPosts()

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      }
    }),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<Post, { slug: string }> = async ({
  params,
}) => {
  const slug = params?.slug as string
  const post = await getPostBySlug(slug)
  const content = await markdownToHtml(post.content || '')

  return { props: { ...post, content, slug } }
}

const Article = tw.article`prose lg:prose-lg mx-auto mt-4 mb-32`

type PostProps = InferGetStaticPropsType<typeof getStaticProps>

const PostPage: React.FC<PostProps> = ({ meta, content, slug }) => {
  return (
    <Layout props={{ ...meta, slug }}>
      <Article>
        <section>
          <small>{meta.date.replace(/-/g, '.')}</small>
          <h1>{meta.title}</h1>
        </section>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: TODO: migrate to react-markdown */}
        <section dangerouslySetInnerHTML={{ __html: content }} />
      </Article>
    </Layout>
  )
}

export default PostPage
