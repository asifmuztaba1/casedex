import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/features", "/pricing", "/security", "/privacy", "/terms"],
      disallow: [
        "/api",
        "/_next/",
        "/dashboard",
        "/cases",
        "/hearings",
        "/diary",
        "/documents",
        "/notifications",
        "/research",
        "/settings",
        "/admin",
        "/login",
        "/register",
        "/setup",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: "https://casedex.app/sitemap.xml",
  };
}
