import figure from "rehype-figure";
import katex from "rehype-katex";
import raw from "rehype-raw";
import stringify from "rehype-stringify";
import gfm from "remark-gfm";
import math from "remark-math";
import markdown from "remark-parse";
import prism from "remark-prism";
import remark2rehype from "remark-rehype";
import { unified } from "unified";

export const markdownToHtml = async (content: string): Promise<string> => {
  const result = await unified()
    .use(markdown)
    .use(math)
    .use(prism)
    .use(gfm)
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(raw)
    .use(katex)
    .use(figure, { className: "text-center text-base" })
    .use(stringify)
    .process(content);

  return result.toString();
};
