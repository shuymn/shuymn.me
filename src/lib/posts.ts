import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'

export type Post = {
  slug: string
  meta: PostMeta
  content: string
}

export type PostMeta = {
  title: string
  description: string
  cardImage: string
  date: string
}

const POSTS_DIR = join(process.cwd(), '_posts')

export const getPostBySlug = (slug: string): Post => {
  const realSlug = slug.replace(/\.md$/, '')
  const fullPath = join(POSTS_DIR, `${realSlug}.md`)
  const fileContents = readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return { slug: realSlug, meta: data as PostMeta, content }
}

export const getAllPosts = (): Post[] => {
  const slugs = readdirSync(POSTS_DIR)
  return slugs.map((slug) => getPostBySlug(slug))
}

export const getAllPostsSortByDate = (): Post[] => {
  const posts = getAllPosts()
  return posts.sort((a, b) => {
    if (a.meta.date < b.meta.date) {
      return 1
    }
    return -1
  })
}
