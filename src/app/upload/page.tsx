import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import UploadPageClient from '@/src/app/upload/UploadPageClient';
import PageContainer from '@/src/components/PageContainer';
import PageHeader from '@/src/components/PageHeader';
import { getWig } from '@/src/services/wig';

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

  const wig = await getWig(wigId);

  if (!wig) {
    redirect('/catalog');
  }

  return (
    <PageContainer className="p-4 h-[calc(100vh-2.5rem)] overflow-hidden flex flex-col">
      <PageHeader title="תעלה תמונה של עצמך" backHref={`/wigs/${wigId}`} />

      <div className="flex-1 min-h-0">
        <Suspense fallback={<div>Loading uploader...</div>}>
          <UploadPageClient
            wigId={wigId}
            wigImageUrl={wig.imageUrl}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
