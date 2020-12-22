module.exports = {
  target: "serverless",
  async rewrites() {
    return [
      {
        source: "/feed.xml",
        destination: "/_next/static/feed.xml",
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    if (isServer && !dev) {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = { ...(await originalEntry()) };
        entries["./scripts/generate-rss"] = "./scripts/generate-rss.ts";
        return entries;
      };
    }

    if (!isServer) {
      config.node = {
        fs: "empty",
      };
    }

    return config;
  },
};
