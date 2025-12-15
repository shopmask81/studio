
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'appData', 'siteSettings.json');
const fallbackFaviconPath = path.join(process.cwd(), 'public', 'favicon.ico');

async function getFaviconUrl(): Promise<string> {
    try {
        const settingsData = await fs.readFile(settingsFilePath, 'utf-8');
        const settings = JSON.parse(settingsData);
        if (settings.faviconUrl) {
            return settings.faviconUrl;
        }
    } catch (error) {
        console.error("Could not read site settings for favicon, using fallback.", error);
    }
    // Fallback URL if settings are not available or don't have a favicon
    return '/favicon.ico';
}


export async function GET() {
  const faviconUrl = await getFaviconUrl();

  try {
    const response = await fetch(faviconUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch favicon from URL: ${faviconUrl}. Status: ${response.status}`);
    }

    const imageBlob = await response.blob();
    const headers = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'image/x-icon',
      'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour
    });

    return new NextResponse(imageBlob, { status: 200, headers });

  } catch (error) {
    console.error("Favicon API error:", error);
    // If fetching the dynamic URL fails, serve the static fallback icon
     try {
        const fallbackIcon = await fs.readFile(fallbackFaviconPath);
        return new NextResponse(fallbackIcon, {
            status: 200,
            headers: { 'Content-Type': 'image/x-icon' },
        });
    } catch (fallbackError) {
        console.error("Failed to serve fallback favicon:", fallbackError);
        // If even the fallback fails, return a minimal response
        return new NextResponse('Not Found', { status: 404 });
    }
  }
}

// Revalidate every hour to catch updates
export const revalidate = 3600;
