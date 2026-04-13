import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import cloudinary from '@/src/lib/cloudinary';
import { authOptions } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error('Missing Cloudinary environment variables');
    return Response.json(
      { error: 'Server misconfiguration: Cloudinary credentials not set' },
      { status: 500 },
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 },
      );
    }

    const body = await req.json();

    const { file } = body;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.startsWith('data:image')) {
      return Response.json(
        { error: 'Invalid file: must be an image' },
        { status: 400 },
      );
    }

    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: 'wig-ai/wigs',
    });

    return Response.json({
      imageUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error('Wig upload error:', JSON.stringify(error));
    return Response.json({ error: 'Wig upload failed' }, { status: 500 });
  }
}
