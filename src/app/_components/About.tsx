import type React from "react";

const About: React.FC = () => {
  return (
    <div className="mt-6">
      <div>
        <p>ソフトウェアエンジニア。主にバックエンド領域を主戦場としています。</p>
        <p>SNSキュレーション事業会社、VTuber運営会社を経て現在はBtoBのSaaS企業に在籍。</p>
        <br />
        <p>このサイトは自分のための備忘録であり、内容の正確性は保証しません。</p>
        <p>投稿は全て個人の意見であり、所属する組織の意見ではありません。</p>
        <p>お問い合わせの際は、下記のリンク先からご連絡ください。</p>
      </div>
      <ul className="mt-4 flex space-x-2">
        <li>
          <a
            href="https://x.com/shuymn"
            className="no-underline text-primary visited:text-accent cursor-pointer hover:underline"
          >
            Twitter
          </a>
        </li>
        <li>/</li>
        <li>
          <a
            href="https://github.com/shuymn"
            className="no-underline text-primary visited:text-accent cursor-pointer hover:underline"
          >
            GitHub
          </a>
        </li>
        <li>/</li>
        <li>
          <a
            href="mailto:mail@shuymn.me"
            className="no-underline text-primary visited:text-accent cursor-pointer hover:underline"
          >
            mail
          </a>
        </li>
      </ul>
    </div>
  );
};

export default About;
