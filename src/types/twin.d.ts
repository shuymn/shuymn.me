import type styledImport from 'styled-components'
import 'twin.macro'

declare module 'twin.macro' {
  export const styled: typeof styledImport
}
