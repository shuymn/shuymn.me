import type React from 'react'

const About: React.FC = () => {
  return (
    <section className="mt-8 mb-8">
      <div>
        <p>
          日常的なことやプログラミングに関する個人的な記事を投稿しています。
        </p>
        <p>投稿は全て個人の意見であり、所属する組織の意見ではありません。</p>
        <p>お問い合わせの際は、下記のリンク先からご連絡ください。</p>
      </div>
      <ul className="mt-4 flex space-x-2">
        <li>
          <a
            href="https://x.com/shuymn"
            className="no-underline text-blue-600 visited:text-purple-600 cursor-pointer"
          >
            Twitter
          </a>
        </li>
        <li>/</li>
        <li>
          <a
            href="https://github.com/shuymn"
            className="no-underline text-blue-600 visited:text-purple-600 cursor-pointer"
          >
            GitHub
          </a>
        </li>
        <li>/</li>
        <li>
          <a
            href="mailto:mail@shuymn.me"
            className="no-underline text-blue-600 visited:text-purple-600 cursor-pointer"
          >
            mail
          </a>
        </li>
      </ul>
    </section>
  )
}

export default About
