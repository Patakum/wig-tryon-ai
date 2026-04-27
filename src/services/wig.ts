import { prisma } from '@/src/lib/prisma';
import { uploadWig } from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';

export async function uploadWigReferenceImage(file: string): Promise<string> {
  const { secureUrl } = await uploadWig(file);
  return secureUrl;
}

export async function getWigOrThrow(wigId: string) {
  const wig = await prisma.wig.findUnique({ where: { id: wigId } });

  if (!wig) {
    throwApiError(404, 'NOT_FOUND', 'Wig not found');
  }

  return wig;
}
