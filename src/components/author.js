/**
 * Author component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"

import { rhythm } from "../utils/typography"

const Author = () => {
  const data = useStaticQuery(graphql`
    query AuthorQuery {
      site {
        siteMetadata {
          author {
            name
          }
          social {
            twitter
            github
            mail
          }
        }
      }
    }
  `)

  const { author, social } = data.site.siteMetadata
  const accounts = [
    {
      name: `Twitter`,
      url: `https://twitter.com/${social.twitter}`,
    },
    {
      name: `GitHub`,
      url: `https://github.com/${social.github}`,
    },
    {
      name: `Mail`,
      url: `mailto:${social.mail}`,
    },
  ]

  return (
    <div>
      <h3
        style={{
          marginBottom: rhythm(1 / 2),
        }}
      >
        Author
      </h3>
      <div style={{ marginBottom: rhythm(1 / 4) }}>{author.name}</div>
      {accounts.map((account, i) => {
        const isLast = i === accounts.length - 1
        return (
          <span key={account.name}>
            <a style={{ boxShadow: `none` }} href={account.url}>
              {account.name}
            </a>
            {isLast ? `` : ` / `}
          </span>
        )
      })}
    </div>
  )
}

export default Author
