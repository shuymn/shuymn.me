import "twin.macro";
import styledImport from "styled-components";

declare module "twin.macro" {
  export const styled: typeof styledImport;
}
