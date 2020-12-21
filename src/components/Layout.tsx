import Head from "next/head";
import { Header } from "./Header";

const WEBSITE_NAME = "shuymn.me";

type Props = {
  props: { title: string; description: string; cardImage: string };
};

export const Layout: React.FC<Props> = ({
  children,
  props: { title, description, cardImage },
}) => {
  const fullTitle = title === "" ? WEBSITE_NAME : `${title} - ${WEBSITE_NAME}`;

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="robots" content="follow, index" />
        <link href="/favicon.ico" rel="shortcut icon" />
        <meta content={description} name="description" />
        {/* <meta property="og:type" content="website" /> */}
        {/* <meta property="og:site_name" content={WEBSITE_NAME} /> */}
        {/* <meta property="og:description" content={description} /> */}
        {/* <meta property="og:title" content={title} /> */}
        {/* <meta property="og:image" content={cardImage} /> */}
        {/* <meta name="twitter:card" content="summary" /> */}
        {/* <meta name="twitter:site" content="@shuymn" /> */}
        {/* <meta name="twitter:title" content={fullTitle} /> */}
        {/* <meta name="twitter:description" content={description} /> */}
        {/* <meta name="twitter:image" content={cardImage} /> */}
        <link
          href="https://unpkg.com/prismjs/themes/prism-okaidia.css"
          rel="stylesheet"
        />
      </Head>
      <Header title={WEBSITE_NAME} />
      <main>{children}</main>
    </>
  );
};
