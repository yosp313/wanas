import type { NextConfig } from "next";
import { locales } from "./lib/i18n/config";

const localePattern = locales.join("|");

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    globalNotFound: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return {
      // The dynamic locale segment would otherwise match unsupported languages.
      afterFiles: [
        {
          source: `/:segment((?!(?:${localePattern}|404|__clerk|_next)(?:/|$))[^/]+)/:path*`,
          destination: "/404",
        },
      ],
      // A statically generated 404 can return its status before streaming starts.
      fallback: [
        { source: `/:locale(${localePattern})/:path*`, destination: "/:locale/404" },
      ],
    };
  },
};

export default nextConfig;
