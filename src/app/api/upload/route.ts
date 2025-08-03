// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary with your credentials from .env.local
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  // Convert the file to a buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    // Upload the file to Cloudinary and define the result type
    const uploadResult = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        // You can add folders and other options here
      }, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      }).end(buffer);
    });

    if (!uploadResult) {
      throw new Error("Cloudinary upload failed.");
    }

    // We will use this URL later for OCR
    // For now, we just return it to confirm success
    return NextResponse.json({ success: true, url: uploadResult.secure_url });

  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 });
  }
}