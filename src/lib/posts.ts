import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

export type Post = {
  slug: string;
  meta: PostMeta;
  content: string;
};

export type PostMeta = {
  title: string;
  description: string;
  cardImage: string;
  date: string;
};

const POSTS_DIR = join(process.cwd(), "posts");

export const getPostBySlug = async (slug: string): Promise<Post> => {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(POSTS_DIR, `${realSlug}.md`);
  const fileContents = readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return { slug: realSlug, meta: data as PostMeta, content };
};

export const getAllPosts = async (): Promise<Post[]> => {
  const slugs = readdirSync(POSTS_DIR);
  const promises = slugs.map((slug) => getPostBySlug(slug));
  return Promise.all(promises);
};

export const getAllPostsSortByDate = async (): Promise<Post[]> => {
  const posts = await getAllPosts();
  return posts.sort((a, b) => {
    if (a.meta.date < b.meta.date) {
      return 1;
    }
    return -1;
  });
};
