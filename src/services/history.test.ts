import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: { generation: { findMany: vi.fn(), findUnique: vi.fn() } },
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));

import { getHistoryDetail, getHistoryForUser } from '@/src/services/history';

function row(id: string, status = 'completed', hasFeedback = false) {
  return {
    id,
    status,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    wig: { name: `wig-${id}` },
    feedback: hasFeedback ? { id: `f-${id}` } : null,
  };
}

describe('history', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('scopes the query to the user, newest first, with a lookahead row', async () => {
    mocks.prisma.generation.findMany.mockResolvedValue([]);

    await getHistoryForUser('user-a', { limit: 2 });

    expect(mocks.prisma.generation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-a' }),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 3,
      }),
    );
  });

  it('returns a next cursor only when more rows exist', async () => {
    mocks.prisma.generation.findMany.mockResolvedValue([
      row('g3'),
      row('g2'),
      row('g1'),
    ]);

    const page = await getHistoryForUser('user-a', { limit: 2 });

    expect(page.items.map((item) => item.id)).toEqual(['g3', 'g2']);
    expect(page.nextCursor).toBe('g2');
  });

  it('has no cursor on the last page and maps feedback state', async () => {
    mocks.prisma.generation.findMany.mockResolvedValue([
      row('g2', 'completed', true),
      row('g1', 'pending', false),
    ]);

    const page = await getHistoryForUser('user-a', { limit: 5 });

    expect(page.nextCursor).toBeNull();
    expect(page.items).toMatchObject([
      { id: 'g2', status: 'completed', hasFeedback: true, wigName: 'wig-g2' },
      { id: 'g1', status: 'pending', hasFeedback: false },
    ]);
  });

  it('passes the cursor and skips the cursor row', async () => {
    mocks.prisma.generation.findMany.mockResolvedValue([]);

    await getHistoryForUser('user-a', { cursor: 'g2' });

    expect(mocks.prisma.generation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: 'g2' }, skip: 1 }),
    );
  });

  it('rejects another customer from reading a history detail', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue({
      id: 'g1',
      userId: 'user-a',
      guestSessionId: null,
    });

    await expect(
      getHistoryDetail('g1', { userId: 'user-b', guestSessionId: null }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('returns not found for an unknown generation', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(null);

    await expect(
      getHistoryDetail('missing', { userId: 'user-a', guestSessionId: null }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
