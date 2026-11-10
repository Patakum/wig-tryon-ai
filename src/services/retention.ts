import { prisma } from '@/src/lib/prisma';
import {
  ACCOUNT_RETENTION_DAYS,
  GUEST_RETENTION_HOURS,
  TOMBSTONE_RETENTION_HOURS,
} from '@/src/lib/retention-policy';
import {
  purgeStoredImages,
  type StoredImage,
} from '@/src/services/try-on-deletion';

const BATCH_SIZE = 50;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type CleanupSummary = {
  generationsDeleted: number;
  photosDeleted: number;
  guestSessionsDeleted: number;
  failures: number;
};

function expiredWhere(now: Date) {
  const guestCutoff = new Date(now.getTime() - GUEST_RETENTION_HOURS * HOUR_MS);
  const accountCutoff = new Date(
    now.getTime() - ACCOUNT_RETENTION_DAYS * DAY_MS,
  );
  const tombstoneCutoff = new Date(
    now.getTime() - TOMBSTONE_RETENTION_HOURS * HOUR_MS,
  );

  return [
    // Guest data nobody signed in to claim. A signed-in transfer sets userId,
    // which moves the row to the account rule below.
    {
      userId: null,
      guestSessionId: { not: null },
      createdAt: { lt: guestCutoff },
    },
    { userId: { not: null }, createdAt: { lt: accountCutoff } },
    { deletedAt: { lt: tombstoneCutoff } },
  ];
}

function toImages(...images: StoredImage[]): StoredImage[] {
  return images.filter((image) => image.imageUrl || image.publicId);
}

/**
 * Deletes data past its retention period: expired guest and account try-ons
 * with their stored files, expired photos nothing references any more, old
 * soft-delete tombstones and expired guest sessions. Files are removed
 * before the database rows, so a failure keeps the row and the next run
 * retries it. Work is batched to stay within serverless time limits.
 */
export async function runRetentionCleanup(
  now = new Date(),
): Promise<CleanupSummary> {
  const summary: CleanupSummary = {
    generationsDeleted: 0,
    photosDeleted: 0,
    guestSessionsDeleted: 0,
    failures: 0,
  };
  const where = expiredWhere(now);

  const generations = await prisma.generation.findMany({
    where: { OR: where },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
    select: { id: true, resultImageUrl: true, resultPublicId: true },
  });

  for (const generation of generations) {
    try {
      await purgeStoredImages(
        toImages({
          imageUrl: generation.resultImageUrl,
          publicId: generation.resultPublicId,
        }),
      );
      await prisma.$transaction([
        prisma.feedback.deleteMany({ where: { generationId: generation.id } }),
        prisma.generation.delete({ where: { id: generation.id } }),
      ]);
      summary.generationsDeleted += 1;
    } catch (error) {
      summary.failures += 1;
      console.error('[retention] generation cleanup failed', generation.id, error);
    }
  }

  // Photos go after their generations, and only when nothing uses them.
  const photos = await prisma.photo.findMany({
    where: { OR: where, generations: { none: {} } },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
    select: { id: true, imageUrl: true, imagePublicId: true },
  });

  for (const photo of photos) {
    try {
      await purgeStoredImages(
        toImages({ imageUrl: photo.imageUrl, publicId: photo.imagePublicId }),
      );
      await prisma.photo.delete({ where: { id: photo.id } });
      summary.photosDeleted += 1;
    } catch (error) {
      summary.failures += 1;
      console.error('[retention] photo cleanup failed', photo.id, error);
    }
  }

  const sessions = await prisma.guestSession.deleteMany({
    where: {
      expiresAt: { lt: now },
      photos: { none: {} },
      generations: { none: {} },
    },
  });
  summary.guestSessionsDeleted = sessions.count;

  return summary;
}
