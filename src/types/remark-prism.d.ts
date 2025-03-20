declare module 'remark-prism' {
  import type { Plugin } from 'unified'
  const remarkPrism: Plugin<[]>
  export = remarkPrism
}
