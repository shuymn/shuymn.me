import Link from "next/link";
import type React from "react";

const PostLink: React.FC<{
  props: { slug: string; date: string; title: string };
}> = ({ props: { slug, date, title } }) => {
  return (
    <div className="mb-6">
      <p className="text-sm text-muted">{date.replace(/-/g, ".")}</p>
      <Link href={`/posts/${slug}`} className="text-lg no-underline text-primary visited:text-accent cursor-pointer">
        {title}
      </Link>
    </div>
  );
};

export default PostLink;
