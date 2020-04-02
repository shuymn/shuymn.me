/**
 * About component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"

import { rhythm } from "../utils/typography"

const About = ({ location }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRoot = location.pathname === rootPath

  if (isRoot) {
    return (
      <div
        style={{
          marginBottom: rhythm(2.5),
        }}
      >
        <h3
          style={{
            marginBottom: rhythm(1 / 2),
          }}
        >
          About
        </h3>
        <p>
          日常的なことやプログラミングに関する個人的な記事を投稿しています。
          <br />
          投稿は全て個人の意見であり、所属する組織の意見ではありません。
          <br />
          お問い合わせは、下記のリンク先からご連絡ください。
        </p>
      </div>
    )
  } else {
    return (
      <div
        style={{
          marginBottom: rhythm(2.5),
        }}
      >
        <h3
          style={{
            marginBottom: rhythm(1 / 2),
          }}
        >
          About
        </h3>
        <p>
          日常的なことやプログラミングに関する個人的な記事を投稿しています。
          <br />
          投稿は全て個人の意見であり、所属する組織の意見ではありません。
        </p>
      </div>
    )
  }
}

export default About
