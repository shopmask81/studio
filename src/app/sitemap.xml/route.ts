
import type { NextRequest } from 'next/server';

// Define the static pages to include in the sitemap.
const staticPages = [
  '/',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
];

export function GET(request: NextRequest) {
  // Use the request headers to dynamically determine the base URL.
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  // Get the current date in ISO 8601 format.
  const lastModified = new Date().toISOString();

  // Generate the XML for the sitemap.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((path) => `
    <url>
      <loc>${baseUrl}${path}</loc>
      <lastmod>${lastModified}</lastmod>
    </url>
  `)
    .join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
