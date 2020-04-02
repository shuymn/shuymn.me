import React from "react"
import { Link, graphql } from "gatsby"

import About from "../components/about"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

const AllPostsPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  return (
    <Layout title={siteTitle}>
      <SEO title="All posts" />
      <About location={location} />
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
          All Posts
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
    </Layout>
  )
}

export default AllPostsPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
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
