
import { NextRequest, NextResponse } from 'next/server';

// This route now accepts POST requests
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const deleteUrl = body.deleteUrl;

        if (!deleteUrl || typeof deleteUrl !== 'string') {
            return NextResponse.json({ error: 'Invalid deleteUrl provided.' }, { status: 400 });
        }
        
        // CRITICAL FIX: IMGBB's delete URL needs to be visited with a GET request,
        // not called with a DELETE method. We are acting as a server-side proxy.
        const imgbbResponse = await fetch(deleteUrl, {
            method: 'GET',
        });

        // The response will likely be HTML, not JSON. We check the status to confirm.
        // A successful deletion often results in a 200 OK or a redirect.
        if (imgbbResponse.ok) {
            return NextResponse.json({ success: true, message: 'Image deletion successful.' }, { status: 200 });
        } else {
            const errorBody = await imgbbResponse.text();
            return NextResponse.json({ 
                error: 'Failed to delete image from ImgBB.',
                details: errorBody,
                status: imgbbResponse.status,
            }, { status: imgbbResponse.status });
        }

    } catch (error) {
        console.error('API Route Error in /api/delete-image:', error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
