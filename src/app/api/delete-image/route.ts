
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const deleteUrl = body.deleteUrl;

        if (!deleteUrl || typeof deleteUrl !== 'string') {
            return NextResponse.json({ error: 'Invalid deleteUrl provided.' }, { status: 400 });
        }
        
        // The deleteUrl from ImgBB contains all that's needed.
        // We are acting as a server-side proxy to bypass client-side CORS restrictions.
        const imgbbResponse = await fetch(deleteUrl, {
            method: 'DELETE',
        });

        // ImgBB's delete endpoint might not return a JSON body or might redirect.
        // We'll consider any 2xx or 3xx response as likely successful.
        if (imgbbResponse.ok || (imgbbResponse.status >= 300 && imgbbResponse.status < 400)) {
            return NextResponse.json({ success: true, message: 'Image deletion initiated.' }, { status: 200 });
        } else {
            // Try to parse the error from ImgBB if possible
            let errorBody = 'Unknown error from ImgBB.';
            try {
                errorBody = await imgbbResponse.text();
            } catch {}
            
            return NextResponse.json({ 
                error: 'Failed to delete image from ImgBB.',
                details: errorBody,
                status: imgbbResponse.status,
            }, { status: imgbbResponse.status });
        }

    } catch (error) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
