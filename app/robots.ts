import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/login", "/signup"],
      // Everything else requires authentication and is per-user training/club
      // data — never meant to be crawled or indexed.
      disallow: "/",
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
