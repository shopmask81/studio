
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import siteSettings from '@/../appData/siteSettings.json';

const enSeoPath = path.join(process.cwd(), 'src', 'data', 'seo.json');
const arSeoPath = path.join(process.cwd(), 'src', 'data', 'seo-ar.json');


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
        throw new Error(`Image upload failed with status: ${response.status}`);
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

    return NextResponse.json({
      en: JSON.parse(enContent),
      ar: JSON.parse(arContent),
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
    const enDataString = formData.get('en') as string | null;
    const arDataString = formData.get('ar') as string | null;
    const ogImageFile = formData.get('ogImageFile') as File | null;
    
    if (!enDataString || !arDataString) {
        return NextResponse.json({ error: 'Missing SEO data.' }, { status: 400 });
    }

    let enData = JSON.parse(enDataString);
    const arData = JSON.parse(arDataString);

    if (ogImageFile) {
        const { url } = await uploadToImgBB(ogImageFile);
        enData.ogImage = url;
    }
    
    await fs.writeFile(enSeoPath, JSON.stringify(enData, null, 2), 'utf8');
    await fs.writeFile(arSeoPath, JSON.stringify(arData, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'SEO settings saved successfully.' });

  } catch (error) {
    console.error('API Error saving SEO file:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
