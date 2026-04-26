import { prisma } from '@/src/lib/prisma';
import cloudinary from '@/src/lib/cloudinary';
import OpenAI, { toFile } from 'openai';

export async function POST(req: Request) {
  try {
    // const session = await getServerSession(authOptions);

    // let userId: string | null = null;
    // if (session?.user?.email) {
    //   const user = await prisma.user.findUnique({
    //     where: { email: session.user.email },
    //     select: { id: true },
    //   });
    //   userId = user?.id ?? null;
    // }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: 'OpenAI API key not configured. Set OPENAI_API_KEY.' },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const { photoId, wigId } = await req.json();

    // Get data from DB
    const [photo, wig] = await Promise.all([
      prisma.photo.findUnique({ where: { id: photoId } }),
      prisma.wig.findUnique({ where: { id: wigId } }),
    ]);

    if (!photo || !wig) {
      return Response.json({ error: 'Invalid data' }, { status: 400 });
    }

    // if (photo.userId
    //   && photo.userId !== userId
    // ) {
    //   return Response.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Create generation entry
    const generation = await prisma.generation.create({
      data: {
        userId: photo.userId,
        photoId,
        wigId,
        status: 'pending',
      },
    });

    // Fetch image data from Cloudinary URLs
    const [selfieResponse, wigResponse] = await Promise.all([
      fetch(photo.imageUrl),
      fetch(wig.imageUrl),
    ]);

    if (!selfieResponse.ok || !wigResponse.ok) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'failed' },
      });
      return Response.json(
        { error: 'Failed to fetch images for generation.' },
        { status: 500 },
      );
    }

    const [selfieBuffer, wigBuffer] = await Promise.all([
      selfieResponse.arrayBuffer(),
      wigResponse.arrayBuffer(),
    ]);

    const [selfieFile, wigFile] = await Promise.all([
      toFile(Buffer.from(selfieBuffer), 'selfie.png', { type: 'image/png' }),
      toFile(Buffer.from(wigBuffer), 'wig.png', { type: 'image/png' }),
    ]);

    const prompt = `Replace the hairstyle of the person in the first image with the hairstyle from the second image. Keep the same face, identity, and facial features. Do not change the person. Make the result photorealistic with natural lighting. Match the hairstyle exactly in shape and color.`;

    // Call OpenAI image edit — selfie as first image, wig reference as second
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: [selfieFile, wigFile],
      prompt,
      size: '1024x1024',
    });

    const base64 = response.data?.[0]?.b64_json;

    if (!base64) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'failed' },
      });
      return Response.json(
        { error: 'OpenAI returned no image data.' },
        { status: 500 },
      );
    }

    // Upload result to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64}`,
      { folder: 'generations' },
    );

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        resultImageUrl: uploadResult.secure_url,
        status: 'completed',
      },
    });

    return Response.json({ generationId: generation.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message.toLowerCase().includes('insufficient_quota') ||
      message.toLowerCase().includes('billing')
    ) {
      return Response.json(
        {
          error:
            'OpenAI billing error: insufficient quota. Add credits at https://platform.openai.com/account/billing and retry.',
        },
        { status: 402 },
      );
    }

    console.error(error);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
