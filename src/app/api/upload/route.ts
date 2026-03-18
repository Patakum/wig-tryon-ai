import { NextRequest } from 'next/server';
import cloudinary from '@/src/lib/cloudinary';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { file } = body;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!file.startsWith('data:image')) {
      return Response.json({ error: 'Invalid file' }, { status: 400 });
    }

    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: 'wig-ai',
    });

    // Save to DB (temporary userId for now)
    const photo = await prisma.photo.create({
      data: {
        userId: 'temp-user', // todo: replace later with auth
        imageUrl: uploadResponse.secure_url,
      },
    });

    return Response.json({
      photoId: photo.id,
      imageUrl: photo.imageUrl,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
