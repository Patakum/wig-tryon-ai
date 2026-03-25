import UploadClientImage from '@/src/components/UploadClientImage';
import { Suspense } from 'react';

type UploadPageProps = {
  searchParams: Promise<{
    wigId?: string;
  }>;
};

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const { wigId } = await searchParams;

  if (!wigId) {
    return <p className="p-4">Missing wig selection</p>;
  }

  return (
    <main className="p-4">
      <div className="mb-4">
        <h1 className="text-xl">תעלה תמונה של עצמך</h1>
        <p className="mt-2">פאה נבחרה: {wigId}</p>
      </div>

      <Suspense fallback={<div>Loading uploader...</div>}>
        <UploadClientImage wigId={wigId} />
      </Suspense>
    </main>
  );
}
