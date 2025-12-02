
import type { SiteSettings } from '@/lib/types';

export async function uploadImage(imageFile: File): Promise<{ url: string; delete_url: string }> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '518d3cdcaedf3c5ade143a41de38c554';
  if (!apiKey) {
    throw new Error('ImgBB API key is not configured.');
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Image upload failed: ${errorBody}`);
  }

  const result = await response.json();
  if (!result.data || !result.data.url) {
    throw new Error('Invalid response from image upload service.');
  }
  
  return { url: result.data.url, delete_url: result.data.delete_url };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  const response = await fetch('/api/site-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save settings.');
  }
}
