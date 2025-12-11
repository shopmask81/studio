
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define paths to the source-of-truth files in /src and the serving files in /public
const srcRobotsPath = path.join(process.cwd(), 'src', 'data', 'seo', 'robots.txt');
const srcSitemapPath = path.join(process.cwd(), 'src', 'data', 'seo', 'sitemap.xml');
const publicRobotsPath = path.join(process.cwd(), 'public', 'robots.txt');
const publicSitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

// Ensure directories exist
const ensureDirectories = async () => {
    await fs.mkdir(path.dirname(srcRobotsPath), { recursive: true });
    await fs.mkdir(path.dirname(publicRobotsPath), { recursive: true });
};

// GET handler to read the current SEO files
export async function GET(request: NextRequest) {
  try {
    await ensureDirectories();
    const robotsContent = await fs.readFile(srcRobotsPath, 'utf8').catch(() => '');
    const sitemapContent = await fs.readFile(srcSitemapPath, 'utf8').catch(() => '');

    return NextResponse.json({
      robots: robotsContent,
      sitemap: sitemapContent,
    });
  } catch (error) {
    console.error('API Error fetching SEO settings:', error);
    return NextResponse.json({ error: 'Failed to load SEO files.' }, { status: 500 });
  }
}

// POST handler to save updated SEO files
export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    const body = await request.json();
    const { fileType, content } = body;

    if (!content || typeof content !== 'string') {
        return NextResponse.json({ error: 'Content is missing or invalid.' }, { status: 400 });
    }

    if (fileType === 'robots') {
        // Write to both /src and /public
        await fs.writeFile(srcRobotsPath, content, 'utf8');
        await fs.writeFile(publicRobotsPath, content, 'utf8');
    } else if (fileType === 'sitemap') {
        // Write to both /src and /public
        await fs.writeFile(srcSitemapPath, content, 'utf8');
        await fs.writeFile(publicSitemapPath, content, 'utf8');
    } else {
        return NextResponse.json({ error: 'Invalid file type specified.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${fileType} file saved successfully.` });

  } catch (error) {
    console.error(`API Error saving ${body.fileType} file:`, error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
