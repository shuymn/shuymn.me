import type React from 'react'
import Link from 'next/link'

const PostLink: React.FC<{
  props: { slug: string; date: string; title: string }
}> = ({ props: { slug, date, title } }) => {
  return (
    <div className="mb-6">
      <p className="text-sm text-gray-800">{date.replace(/-/g, '.')}</p>
      <Link
        href={`/posts/${slug}`}
        className="text-lg no-underline text-blue-600 visited:text-purple-600 cursor-pointer"
      >
        {title}
      </Link>
    </div>
  )
}

export default PostLink
