import React from "react"
import { Link, graphql } from "gatsby"

import Author from "../components/author"
import About from "../components/about"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

const Index = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  return (
    <Layout title={siteTitle}>
      <SEO title="Top Page" />
      <div
        style={{
          marginBottom: rhythm(2),
        }}
      >
        <h3
          style={{
            marginBottom: rhythm(2 / 3),
          }}
        >
          Recent Posts
        </h3>
        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <div key={node.fields.slug} style={{ marginBottom: rhythm(1 / 2) }}>
              <small>
                <p style={{ marginBottom: 0 }}>{node.frontmatter.date}</p>
              </small>
              <Link style={{ boxShadow: `none` }} to={node.fields.slug}>
                {title}
              </Link>
            </div>
          )
        })}
      </div>
      <About location={location} />
      <Author />
    </Layout>
  )
}

export default Index

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      limit: 5
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "YYYY.MM.DD")
            title
          }
        }
      }
    }
  }
`
