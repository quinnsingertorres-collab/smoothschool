import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Serve the whole app from sequinn.xyz/schoolmanage.
  basePath: BASE_PATH,
  async redirects() {
    return [
      // While this is the only thing on the domain, send the bare domain to
      // the app. Once another project owns sequinn.xyz/, that project's
      // config takes over "/" and this rule simply never gets hit.
      { source: "/", destination: BASE_PATH, basePath: false, permanent: false },
      // Old links from before the move (/home, /planner, /ap-biology, the
      // home-screen icon...) forward to the same page under the new path.
      {
        source: "/:path((?!schoolmanage(?:/|$)).+)",
        destination: `${BASE_PATH}/:path`,
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
