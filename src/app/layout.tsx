import type { Metadata } from 'next'
import { Noto_Sans_JP, Noto_Sans_Mono } from 'next/font/google'
import { BASE_URL, DEFAULT_OG_IMAGE, WEBSITE_NAME } from '@/lib/constants'
import Header from './_components/Header'
import './globals.css'

const notoSans = Noto_Sans_JP({
  variable: '--font-noto-sans',
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

const notoMono = Noto_Sans_Mono({
  variable: '--font-noto-mono',
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: WEBSITE_NAME,
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="robots" content="follow, index" />
        <link href="/favicon.ico" rel="shortcut icon" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={WEBSITE_NAME} />
      </head>
      <body
        className={`${notoSans.variable} ${notoMono.variable} max-w-3xl px-8 my-8 mx-auto`}
      >
        <Header title={WEBSITE_NAME} />
        <hr className="h-1 border-gray-300" />
        {children}
      </body>
    </html>
  )
}
