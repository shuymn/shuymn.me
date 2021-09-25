import { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import React from "react";
import { Layout } from "src/components/Layout";
import { getAllPostsSortByDate, Post } from "src/lib/posts";
import tw from "twin.macro";

export const getStaticProps: GetStaticProps<{
  posts: Post[];
}> = async () => {
  const posts = await getAllPostsSortByDate();
  return { props: { posts } };
};

const AboutAnchor = tw.a`no-underline text-blue-600 visited:text-purple-600 cursor-pointer`;

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
          <AboutAnchor href="https://twitter.com/shuymn">Twitter</AboutAnchor>
        </li>
        <li>/</li>
        <li>
          <AboutAnchor href="https://github.com/shuymn">GitHub</AboutAnchor>
        </li>
        <li>/</li>
        <li>
          <AboutAnchor href="mailto:mail@shuymn.me">mail</AboutAnchor>
        </li>
      </ul>
    </section>
  );
};

const PostAnchor = tw.a`text-xl no-underline text-blue-600 visited:text-purple-600 cursor-pointer`;

const PostLink: React.FC<{
  props: { slug: string; date: string; title: string };
}> = ({ props: { slug, date, title } }) => {
  return (
    <div className="mb-6">
      <p className="text-sm text-gray-800">{date.replace(/-/g, ".")}</p>
      <Link href="/posts/[slug]" as={`/posts/${slug}`}>
        <PostAnchor>{title}</PostAnchor>
      </Link>
    </div>
  );
};

const IndexPage = ({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Layout
      props={{ title: "", description: "shuymn.me", slug: "", cardImage: "" }}
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
  );
};

export default IndexPage;
