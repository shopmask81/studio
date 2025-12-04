
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'appData', 'siteSettings.json');
const enLocalePath = path.join(process.cwd(), 'src', 'locales', 'en.json');
const arLocalePath = path.join(process.cwd(), 'src', 'locales', 'ar.json');

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

    // Write general settings
    const generalSettingsString = JSON.stringify(newSettings, null, 2);
    await fs.writeFile(settingsFilePath, generalSettingsString, 'utf8');

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

    