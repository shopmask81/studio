
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import siteSettings from '@/../appData/siteSettings.json';

const enSeoPath = path.join(process.cwd(), 'src', 'data', 'seo.json');
const arSeoPath = path.join(process.cwd(), 'src', 'data', 'seo-ar.json');
const robotsPath = path.join(process.cwd(), 'src', 'data', 'seo', 'robots.txt');
const sitemapPath = path.join(process.cwd(), 'src', 'data', 'seo', 'sitemap.xml');
const structuredDataPath = path.join(process.cwd(), 'src', 'data', 'seo', 'structuredData.json');


// For serving live files
const publicRobotsPath = path.join(process.cwd(), 'public', 'robots.txt');
const publicSitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');


async function uploadToImgBB(file: File): Promise<{ url: string }> {
    const apiKey = siteSettings.imgbbApiKey;
    if (!apiKey) {
      throw new Error('ImgBB API key is not configured in site settings.');
    }
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image upload failed: ${errorText}`);
    }

    const result = await response.json();
    if (!result.data || !result.data.url) {
        throw new Error('Invalid response from image upload service.');
    }
    
    return { url: result.data.url };
}

// GET handler to read the current SEO files
export async function GET(request: NextRequest) {
  try {
    const enContent = await fs.readFile(enSeoPath, 'utf8').catch(() => '{}');
    const arContent = await fs.readFile(arSeoPath, 'utf8').catch(() => '{}');
    const robotsContent = await fs.readFile(robotsPath, 'utf8').catch(() => '');
    const sitemapContent = await fs.readFile(sitemapPath, 'utf8').catch(() => '');
    const structuredDataContent = await fs.readFile(structuredDataPath, 'utf8').catch(() => '{}');


    return NextResponse.json({
      en: JSON.parse(enContent),
      ar: JSON.parse(arContent),
      robots: robotsContent,
      sitemap: sitemapContent,
      structuredData: JSON.parse(structuredDataContent),
    });
  } catch (error) {
    console.error('API Error fetching SEO settings:', error);
    return NextResponse.json({ error: 'Failed to load SEO files.' }, { status: 500 });
  }
}

// POST handler to save updated SEO files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const enDataString = formData.get('enHomepage') as string | null;
    const arDataString = formData.get('arHomepage') as string | null;
    const ogImageFile = formData.get('ogImageFile') as File | null;
    const twitterImageFile = formData.get('twitterImageFile') as File | null;
    const robotsFileContent = formData.get('robots') as string | null;
    const sitemapFileContent = formData.get('sitemap') as string | null;
    const structuredDataString = formData.get('structuredData') as string | null;
    
    // Handle Homepage SEO saving
    if (enDataString && arDataString) {
        let enData = JSON.parse(enDataString);
        const arData = JSON.parse(arDataString);

        if (ogImageFile) {
            const { url } = await uploadToImgBB(ogImageFile);
            enData.ogImage = url;
        }

        if (twitterImageFile) {
            const { url } = await uploadToImgBB(twitterImageFile);
            enData.twitterImage = url;
        }
        
        // Read existing files to preserve other potential settings
        const existingEnSeo = JSON.parse(await fs.readFile(enSeoPath, 'utf8').catch(() => '{}'));
        const existingArSeo = JSON.parse(await fs.readFile(arSeoPath, 'utf8').catch(() => '{}'));

        const finalEnData = { ...existingEnSeo, homepage: enData };
        const finalArData = { ...existingArSeo, homepage: arData };

        await fs.writeFile(enSeoPath, JSON.stringify(finalEnData, null, 2), 'utf8');
        await fs.writeFile(arSeoPath, JSON.stringify(finalArData, null, 2), 'utf8');
    }

    // Handle robots.txt saving
    if (robotsFileContent !== null) {
        await fs.writeFile(robotsPath, robotsFileContent, 'utf8');
        await fs.writeFile(publicRobotsPath, robotsFileContent, 'utf8');
    }

    // Handle sitemap.xml saving
    if (sitemapFileContent !== null) {
        await fs.writeFile(sitemapPath, sitemapFileContent, 'utf8');
        await fs.writeFile(publicSitemapPath, sitemapFileContent, 'utf8');
    }
    
    // Handle structured data saving
    if (structuredDataString) {
        const structuredData = JSON.parse(structuredDataString);
        await fs.writeFile(structuredDataPath, JSON.stringify(structuredData, null, 2), 'utf8');
    }


    return NextResponse.json({ success: true, message: 'SEO settings saved successfully.' });

  } catch (error) {
    console.error('API Error saving SEO file:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON format.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
