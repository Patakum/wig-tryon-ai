import { prisma } from '@/src/lib/prisma';
import Replicate from 'replicate';

function extractResultUrl(output: unknown): string | null {
  const first = Array.isArray(output) ? output[0] : output;

  if (typeof first === 'string') {
    return first;
  }

  if (first instanceof URL) {
    return first.toString();
  }

  if (first && typeof first === 'object') {
    const record = first as Record<string, unknown>;

    if (typeof record.url === 'string') {
      return record.url;
    }

    if (typeof record.url === 'function') {
      const value = record.url();
      if (typeof value === 'string') {
        return value;
      }
      if (value instanceof URL) {
        return value.toString();
      }
    }

    if (typeof record.toString === 'function') {
      const value = record.toString();
      if (typeof value === 'string' && value !== '[object Object]') {
        return value;
      }
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    const model = process.env.REPLICATE_MODEL;

    const replicate = new Replicate({ auth: token });

    const { photoId, wigId } = await req.json();

    // Get data from DB
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    const wig = await prisma.wig.findUnique({
      where: { id: wigId },
    });

    if (!photo || !wig) {
      return Response.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Create generation entry
    const generation = await prisma.generation.create({
      data: {
        userId: photo.userId,
        photoId,
        wigId,
        status: 'pending',
      },
    });

    // Call Replicate — zsxkib/instant-id takes face_image + style_image + prompt
    const output = await replicate.run('google/imagen-4', {
      input: {
        prompt: `realistic portrait of a woman wearing a ${wig.name}, studio lighting, high quality`,
      },
    });

    // Save result
    const resultUrl = extractResultUrl(output);

    if (!resultUrl) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
        },
      });

      return Response.json(
        {
          error:
            'Replicate returned an unsupported output format. Could not extract image URL.',
        },
        { status: 500 },
      );
    }

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        resultImageUrl: resultUrl,
        status: 'completed',
      },
    });

    return Response.json({
      generationId: generation.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('status 404')) {
      return Response.json(
        {
          error:
            'Replicate model not found. Check REPLICATE_MODEL (owner/model-name) and that the model is available in your Replicate account.',
        },
        { status: 400 },
      );
    }

    console.error(error);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
