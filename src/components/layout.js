import React from "react"
import { Link } from "gatsby"

import { rhythm } from "../utils/typography"

const Layout = ({ title, children }) => {
  let header

  header = (
    <div>
      <Link
        style={{
          boxShadow: `none`,
          display: `inline`,
          color: `inherit`,
        }}
        to={`/`}
      >
        {title}
      </Link>
      <div style={{ display: `inline`, float: `right` }}>
        <Link
          style={{
            boxShadow: `none`,
            color: `inherit`,
          }}
          to={`/articles`}
        >
          All Posts
        </Link>
        {` / `}
        <a
          style={{
            boxShadow: `none`,
            color: `inherit`,
          }}
          href={`https://google.com/search?q=site:shuymn.me`}
        >
          Search
        </a>
      </div>
    </div>
  )

  return (
    <div
      style={{
        marginLeft: `auto`,
        marginRight: `auto`,
        maxWidth: rhythm(24),
        padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
      }}
    >
      <header>{header}</header>
      <main>{children}</main>
    </div>
  )
}

export default Layout
