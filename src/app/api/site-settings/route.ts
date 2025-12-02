
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the settings file in the new `appData` directory
const settingsFilePath = path.join(process.cwd(), 'appData', 'siteSettings.json');

export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json();

    // Basic validation
    if (!newSettings.siteName || !newSettings.contactEmail) {
      return NextResponse.json({ error: 'Missing required settings fields.' }, { status: 400 });
    }

    const jsonString = JSON.stringify(newSettings, null, 2);

    // Write the string to the file, overwriting it
    await fs.writeFile(settingsFilePath, jsonString, 'utf8');

    // Return a success response without terminating the process
    return NextResponse.json({ success: true, message: 'Settings saved successfully.' });

  } catch (error) {
    console.error('API Error saving site settings:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
