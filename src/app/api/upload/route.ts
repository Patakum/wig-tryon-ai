import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import cloudinary from '@/src/lib/cloudinary';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

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

    let userId: string | null = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }

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

    const photo = await prisma.photo.create({
      data: {
        userId,
        imageUrl: uploadResponse.secure_url,
      },
    });

    return Response.json({
      photoId: photo.id,
      imageUrl: photo.imageUrl,
    });
  } catch (error) {
    console.error('Upload error:', JSON.stringify(error));
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
