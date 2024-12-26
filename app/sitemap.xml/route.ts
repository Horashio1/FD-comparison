import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = "https://www.bestrates.lk";

  // Static pages
  const staticRoutes = [
    "/",
    "/FD_Rates",
    "/Card_Offers",
    "/Tourist_Data",
  ];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticRoutes
      .map(
        (route) => `
      <url>
        <loc>${baseUrl}${route}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${route === "/Card_Offers" ? "1.0" : "0.8"}</priority>
      </url>`
      )
      .join("\n")}
  </urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
