
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'appData', 'siteSettings.json');
const enLocalePath = path.join(process.cwd(), 'src', 'locales', 'en.json');
const arLocalePath = path.join(process.cwd(), 'src', 'locales', 'ar.json');
const publicFaviconPath = path.join(process.cwd(), 'public', 'favicon.ico');

async function updateFavicon(faviconUrl: string) {
    if (!faviconUrl) {
        console.log('No favicon URL provided, skipping update.');
        return;
    }
    try {
        const response = await fetch(faviconUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch new favicon. Status: ${response.status}`);
        }
        const imageBuffer = await response.arrayBuffer();
        await fs.writeFile(publicFaviconPath, Buffer.from(imageBuffer));
        console.log('Successfully updated public/favicon.ico');
    } catch (error) {
        console.error('Failed to update favicon.ico:', error);
    }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { general: newSettings, content: newContent } = body;

    // Validate general settings
    if (!newSettings.siteName || !newSettings.contactEmail) {
      return NextResponse.json({ error: 'Missing required general settings fields.' }, { status: 400 });
    }

    // Validate content
    if (!newContent || !newContent.en || !newContent.ar) {
        return NextResponse.json({ error: 'Missing required content fields.' }, { status: 400 });
    }

    // Read current settings to check if favicon has changed
    let oldFaviconUrl = '';
    try {
        const currentSettingsRaw = await fs.readFile(settingsFilePath, 'utf8');
        const currentSettings = JSON.parse(currentSettingsRaw);
        oldFaviconUrl = currentSettings.faviconUrl;
    } catch {
        // Ignore if the file doesn't exist yet
    }

    // Write general settings
    const generalSettingsString = JSON.stringify(newSettings, null, 2);
    await fs.writeFile(settingsFilePath, generalSettingsString, 'utf8');
    
    // If the favicon URL has changed, update the physical file
    if (newSettings.faviconUrl && newSettings.faviconUrl !== oldFaviconUrl) {
        await updateFavicon(newSettings.faviconUrl);
    }

    // Write content settings
    const enContentString = JSON.stringify(newContent.en, null, 2);
    await fs.writeFile(enLocalePath, enContentString, 'utf8');

    const arContentString = JSON.stringify(newContent.ar, null, 2);
    await fs.writeFile(arLocalePath, arContentString, 'utf8');

    return NextResponse.json({ success: true, message: 'Settings saved successfully.' });

  } catch (error) {
    console.error('API Error saving site settings:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
