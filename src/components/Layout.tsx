import Head from 'next/head'
import type React from 'react'
import { Header } from './Header'

const WEBSITE_NAME = 'shuymn.me'

type Props = {
  props: {
    title: string
    description: string
    slug: string
    cardImage: string
  }
}

export const Layout: React.FC<Props> = ({
  children,
  props: { title, description, slug, cardImage },
}) => {
  const twitterCard = cardImage ? 'summary_large_image' : 'summary'
  const url = slug ? `https://shuymn.me/posts/${slug}` : 'https://shuymn.me'

  title = title || WEBSITE_NAME
  cardImage = cardImage || 'https://shuymn.me/default_og_image.jpg'

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="robots" content="follow, index" />
        <link href="/favicon.ico" rel="shortcut icon" />
        <meta content={description} name="description" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={WEBSITE_NAME} />
        <meta property="og:description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={cardImage} />
        <meta name="twitter:card" content={twitterCard} />
        <link
          href="https://unpkg.com/prismjs/themes/prism-okaidia.css"
          rel="stylesheet"
        />
      </Head>
      <Header title={WEBSITE_NAME} />
      <main>{children}</main>
    </>
  )
}
