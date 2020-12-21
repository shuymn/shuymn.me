import katex from "rehype-katex";
import raw from "rehype-raw";
import stringify from "rehype-stringify";
import math from "remark-math";
import markdown from "remark-parse";
import prism from "remark-prism";
import remark2rehype from "remark-rehype";
import unified from "unified";

export const markdownToHtml = async (content: string): Promise<string> => {
  const result = await unified()
    .use(markdown)
    .use(math)
    .use(prism)
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(raw)
    .use(katex)
    .use(stringify)
    .process(content);

  return result.toString();
};
