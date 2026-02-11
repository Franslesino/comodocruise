import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
  // Rewrites work in dev mode to proxy API requests (bypasses CORS/SSL issues)
  async rewrites() {
    return [
      {
        source: '/proxy-api/:path*',
        destination: 'https://ac0c4wsgo0cg4sc8ksos04ko.49.13.148.202.sslip.io/api/:path*',
      },
    ];
  },
};

export default nextConfig;
