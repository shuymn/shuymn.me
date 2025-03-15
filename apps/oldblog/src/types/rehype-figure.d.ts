declare module "rehype-figure" {
  import { Plugin, Processor } from "unified";

  type Options = {
    className: string;
  };

  const rehypeFigure: Plugin<[Options?] | [Processor?, Options?]>;
  export = rehypeFigure;
}
