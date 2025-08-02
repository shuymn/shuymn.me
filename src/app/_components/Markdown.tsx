import shell from "@shikijs/langs/shellscript";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
import ReactMarkdown from "react-markdown";
import rehypeFigure from "rehype-figure";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { createJavaScriptRegexEngine } from "shiki";
import { createHighlighterCoreSync } from "shiki/core";

const highlighter = createHighlighterCoreSync({
  themes: [githubDark, githubLight],
  langs: [shell],
  engine: createJavaScriptRegexEngine(),
});

type MarkdownProps = {
  content: string;
};

export default function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw,
        [rehypeFigure, { className: "text-center text-base" }],
        [
          rehypeShikiFromHighlighter,
          highlighter,
          {
            themes: {
              light: "github-light",
              dark: "github-dark",
            },
            defaultColor: "light-dark()",
          },
        ],
      ]}
    >
      {content}
    </ReactMarkdown>
  );
}
