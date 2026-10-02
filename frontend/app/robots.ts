import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, SITE_URL } from "@/lib/public-pages";

// AGENTS.md §20: crawlers may index public pages only. Everything else
// (workspace, admin, auth, API) is disallowed by default, so new app routes
// stay private without having to be listed here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", ...PUBLIC_PATHS.filter((path) => path !== "/").map((path) => `${path}$`)],
      disallow: ["/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
