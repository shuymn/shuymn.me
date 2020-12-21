import Link from "next/link";
import tw from "twin.macro";

type Props = {
  title: string;
};

const Anchor = tw.a`cursor-pointer`;

export const Header: React.FC<Props> = ({ title }) => {
  return (
    <>
      <nav>
        <div className="flex justify-between items-center py-8 mx-auto">
          <Link href="/">
            <a className="no-underline font-semibold text-xl">
              <h1>{title}</h1>
            </a>
          </Link>
          <ul className="flex justify-between items-center space-x-4">
            <li>
              <Anchor href="https://google.com/search?q=site:shuymn.me">
                Search
              </Anchor>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};
