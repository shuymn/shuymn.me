import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { Layout } from "src/components/Layout";
import { markdownToHtml } from "src/lib/markdown";
import { getAllPosts, getPostBySlug, Post } from "src/lib/posts";
import tw from "twin.macro";

import "katex/dist/katex.min.css";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPosts();

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Post, { slug: string }> = async ({
  params,
}) => {
  const post = await getPostBySlug((params || {}).slug as string);
  const content = await markdownToHtml(post.content || "");

  return { props: { ...post, content } };
};

const Article = tw.article`prose lg:prose-xl mx-auto mt-4 mb-32`;

type PostProps = InferGetStaticPropsType<typeof getStaticProps>;

const PostPage: React.FC<PostProps> = ({ meta, content }) => {
  return (
    <Layout props={meta}>
      <Article>
        <section>
          <small>{meta.date.replace(/-/g, ".")}</small>
          <h1>{meta.title}</h1>
        </section>
        <section dangerouslySetInnerHTML={{ __html: content }} />
      </Article>
    </Layout>
  );
};

export default PostPage;
