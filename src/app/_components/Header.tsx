import Link from "next/link";
import type React from "react";
import ThemeToggle from "./ThemeToggle";

type Props = {
  title: string;
};

const Header: React.FC<Props> = ({ title }) => {
  return (
    <>
      <nav>
        <div className="flex justify-between items-center py-8 mx-auto">
          <Link href="/" className="no-underline font-bold text-xl">
            <h1>{title}</h1>
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
};

export default Header;
