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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    // Upload the file to Cloudinary and use the OCR addon
    const uploadResult = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          // --- YAHAN BADLAV KIYA GAYA HAI ---
          // This tells Cloudinary to run its advanced OCR service on the uploaded file.
          ocr: 'adv_ocr', 
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Error:', error);
            return reject(error);
          }
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    if (!uploadResult) {
      throw new Error("Cloudinary upload failed: No result returned.");
    }

    // --- RESPONSE BHI BADLA GAYA HAI ---
    // Check if OCR data exists in the upload result
    const ocrData = uploadResult.info?.ocr?.adv_ocr?.data;
    let extractedText = '';

    if (ocrData) {
      // Extract the text from all the text annotations
      extractedText = ocrData[0].fullTextAnnotation.text;
    } else {
      console.warn('OCR data not found in Cloudinary response for file:', uploadResult.public_id);
    }

    // Return the extracted text to the frontend
    return NextResponse.json({ 
      success: true, 
      url: uploadResult.secure_url,
      ocrText: extractedText.trim() // <-- Frontend is expecting this field
    });

  } catch (error) {
    console.error('Error in upload route:', error);
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : 'File upload or OCR failed.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}