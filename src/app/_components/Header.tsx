import Link from 'next/link'
import type React from 'react'

type Props = {
  title: string
}

const Header: React.FC<Props> = ({ title }) => {
  return (
    <>
      <nav>
        <div className="flex justify-between items-center py-8 mx-auto">
          <Link href="/" className="no-underline font-semibold text-xl">
            <h1>{title}</h1>
          </Link>
          <ul className="flex justify-between items-center space-x-4">
            <li>
              <a
                href="https://google.com/search?q=site:shuymn.me"
                className="cursor-pointer"
              >
                Search
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  )
}

export default Header
