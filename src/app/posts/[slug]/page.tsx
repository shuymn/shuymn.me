import Markdown from '@/app/_components/Markdown'
import { DEFAULT_OG_IMAGE, WEBSITE_NAME } from '@/lib/constants'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import type { Metadata } from 'next'

export function generateStaticParams() {
  const posts = getAllPosts()

  return posts.map((post) => ({ slug: post.slug }))
}

type Params = {
  params: Promise<{ slug: string }>
}

export default async function Page(props: Params) {
  const { slug } = await props.params
  const { meta, content } = getPostBySlug(slug)

  return (
    <main>
      <article className="prose prose-li:my-0.5 prose-ul:my-0.5 max-w-full mx-auto mt-8 mb-32">
        <section>
          <small>{meta.date.replace(/-/g, '.')}</small>
          <h1>{meta.title}</h1>
        </section>
        <Markdown content={content || ''} />
      </article>
    </main>
  )
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const { slug } = await props.params
  const { meta } = getPostBySlug(slug)

  const title = meta.title || WEBSITE_NAME

  return {
    title,
    description: meta.description,
    openGraph: {
      title,
      description: meta.description,
      images: [meta.cardImage || DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: meta.cardImage ? 'summary_large_image' : 'summary',
    },
  }
}
