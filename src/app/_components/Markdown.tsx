import { MarkdownAsync } from 'react-markdown'
import rehypeFigure from 'rehype-figure'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { createHighlighterCore } from 'shiki/core'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { createOnigurumaEngine } from 'shiki'

const highlighter = await createHighlighterCore({
  themes: [import('@shikijs/themes/github-light')],
  langs: [import('@shikijs/langs/bash')],
  engine: createOnigurumaEngine(() => import('shiki/wasm')),
})

type MarkdownProps = {
  content: string
}

export default async function Markdown({ content }: MarkdownProps) {
  return (
    <MarkdownAsync
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw,
        [rehypeFigure, { className: 'text-center text-base' }],
        [rehypeShikiFromHighlighter, highlighter, { theme: 'github-light' }],
      ]}
    >
      {content}
    </MarkdownAsync>
  )
}
