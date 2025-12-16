
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This route now serves the static file directly, which is updated by the settings handler.
const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');

export async function GET() {
  try {
    const fallbackIcon = await fs.readFile(faviconPath);
    return new NextResponse(fallbackIcon, {
        status: 200,
        headers: { 
            'Content-Type': 'image/x-icon',
            'Cache-Control': 'public, max-age=0, must-revalidate', // Tell browsers to always re-check
        },
    });
  } catch (fallbackError) {
    console.error("Failed to serve favicon.ico:", fallbackError);
    // If the file doesn't exist for some reason, return a 404.
    return new NextResponse('Not Found', { status: 404 });
  }
}

// Revalidate every time to ensure the latest version is served.
export const revalidate = 0;
