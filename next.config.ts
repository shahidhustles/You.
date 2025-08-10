import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Required for BlockNote compatibility with Next.js 15
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "html.tailus.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
