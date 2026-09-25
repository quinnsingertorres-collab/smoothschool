import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const APP_HOST = "school.sequinn.xyz";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  async redirects() {
    return [
      // While the bare domain is still attached to this project, send
      // sequinn.xyz/... (and www) to the app's own subdomain. Once another
      // site owns sequinn.xyz, remove the domain from this project in Vercel
      // and these two rules stop mattering.
      {
        source: "/:path*",
        has: [{ type: "host", value: "sequinn.xyz" }],
        destination: `https://${APP_HOST}/:path*`,
        permanent: false,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.sequinn.xyz" }],
        destination: `https://${APP_HOST}/:path*`,
        permanent: false,
      },
      // Old links and home-screen icons from when the app lived at
      // /schoolmanage forward to the same page at the root.
      { source: "/schoolmanage", destination: "/home", permanent: false },
      { source: "/schoolmanage/:path*", destination: "/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
