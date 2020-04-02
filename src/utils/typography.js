import Typography from "typography"
import Wordpress2016 from "typography-theme-wordpress-2016"

Wordpress2016.overrideThemeStyles = () => {
  return {
    "a.gatsby-resp-image-link": {
      boxShadow: `none`,
    },
    "body, h1, h2, h3": {
      fontFamily: `'Noto Sans JP', sans-serif`,
    },
    "ul, li > ul": {
      marginTop: 0,
      paddingLeft: `1.75rem`,
    },
    "li, li > p": {
      marginBottom: 0,
    },
  }
}

delete Wordpress2016.googleFonts

const typography = new Typography(Wordpress2016)

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
