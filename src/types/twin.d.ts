import "twin.macro"
import styledImport from "styled-components"

declare module "twin.macro" {
  const styled: typeof styledImport
}
