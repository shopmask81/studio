
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the settings file
const settingsFilePath = path.join(process.cwd(), 'src', 'data', 'siteSettings.json');

export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json();

    // Basic validation (you can expand this as needed)
    if (!newSettings.siteName || !newSettings.contactEmail) {
      return NextResponse.json({ error: 'Missing required settings fields.' }, { status: 400 });
    }

    // Convert the settings object to a formatted JSON string
    const jsonString = JSON.stringify(newSettings, null, 2);

    // Write the string to the file, overwriting it
    await fs.writeFile(settingsFilePath, jsonString, 'utf8');

    // In a development environment, programmatically restart the server
    // to ensure the new JSON settings are loaded correctly on all pages.
    if (process.env.NODE_ENV === 'development') {
      process.exit();
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully. The server is restarting to apply changes.' });

  } catch (error) {
    console.error('API Error saving site settings:', error);
    // Check for specific error types if needed
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
