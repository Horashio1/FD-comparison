import { NextResponse } from "next/server";

export async function GET() {
  const robots = `
    User-agent: *
    Allow: /

    Sitemap: https://www.bestrates.lk/sitemap.xml
  `;

  return new NextResponse(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
