import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body className="bg-gray-100 max-w-prose lg:max-w-3xl px-8 my-8 mx-auto">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
