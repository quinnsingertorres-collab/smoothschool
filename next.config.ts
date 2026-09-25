import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  async redirects() {
    return [
      // Visits on the old domain (sequinn.xyz) are handled by proxy.ts,
      // which shows the one-time "this site has moved" notice first.
      // Old links and home-screen icons from when the app lived at
      // /schoolmanage forward to the same page at the root.
      { source: "/schoolmanage", destination: "/home", permanent: false },
      { source: "/schoolmanage/:path*", destination: "/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
