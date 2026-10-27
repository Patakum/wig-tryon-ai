import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { requireOwner } from '@/src/services/ownership';
import { PENDING_TIMEOUT_MS } from '@/src/services/generation-limits';
import type { ViewerIdentity } from '@/src/types/viewer';

export const HISTORY_PAGE_SIZE = 12;

export type HistoryEntry = {
  id: string;
  status: 'completed' | 'pending';
  createdAt: string;
  wigName: string;
  hasFeedback: boolean;
};

export type HistoryPage = {
  items: HistoryEntry[];
  nextCursor: string | null;
};

export async function getHistoryForUser(
  userId: string,
  options: { cursor?: string | null; limit?: number } = {},
): Promise<HistoryPage> {
  const limit = options.limit ?? HISTORY_PAGE_SIZE;

  const rows = await prisma.generation.findMany({
    where: {
      userId,
      deletedAt: null,
      // Pending jobs past the timeout are treated as failed and hidden.
      OR: [
        { status: 'completed' },
        {
          status: 'pending',
          createdAt: { gt: new Date(Date.now() - PENDING_TIMEOUT_MS) },
        },
      ],
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      status: true,
      createdAt: true,
      wig: { select: { name: true } },
      feedback: { select: { id: true } },
    },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: pageRows.map((row) => ({
      id: row.id,
      status: row.status === 'completed' ? 'completed' : 'pending',
      createdAt: row.createdAt.toISOString(),
      wigName: row.wig.name,
      hasFeedback: row.feedback !== null,
    })),
    nextCursor: hasMore ? pageRows[pageRows.length - 1].id : null,
  };
}

export async function getHistoryDetail(
  generationId: string,
  viewer: ViewerIdentity,
) {
  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    select: {
      id: true,
      userId: true,
      guestSessionId: true,
      photoId: true,
      status: true,
      deletedAt: true,
      resultImageUrl: true,
      adminCanSeeSelfie: true,
      adminCanSeeResult: true,
      createdAt: true,
      wig: {
        select: { id: true, name: true, imageUrl: true, price: true },
      },
      feedback: {
        select: { id: true, message: true, updatedAt: true },
      },
    },
  });

  if (!generation || generation.deletedAt) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  requireOwner(generation, viewer);

  return generation;
}
