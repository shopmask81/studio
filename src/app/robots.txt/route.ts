
import type { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  // Use the request headers to dynamically determine the base URL.
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const robotsText = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsText, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
