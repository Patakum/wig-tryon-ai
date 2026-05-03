import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import UploadPageClient from '@/src/app/upload/UploadPageClient';
import { prisma } from '@/src/lib/prisma';

type UploadPageProps = {
  searchParams: Promise<{
    wigId?: string;
  }>;
};

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const { wigId } = await searchParams;

  if (!wigId) {
    redirect('/catalog');
  }

  const wig = await prisma.wig.findUnique({ where: { id: wigId } });

  if (!wig) {
    redirect('/catalog');
  }

  return (
    <main className="p-4">
      <div className="mb-4">
        <h1 className="text-xl">תעלה תמונה של עצמך</h1>
      </div>

      <Suspense fallback={<div>Loading uploader...</div>}>
        <UploadPageClient wigId={wigId} wigImageUrl={wig.imageUrl} />
      </Suspense>
    </main>
  );
}
