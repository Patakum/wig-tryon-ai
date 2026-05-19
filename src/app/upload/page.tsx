import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import UploadPageClient from '@/src/app/upload/UploadPageClient';
import { prisma } from '@/src/lib/prisma';
import PageContainer from '@/src/components/PageContainer';
import Logo from '@/src/components/Logo';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type UploadPageProps = {
  searchParams: Promise<{
    wigId?: string;
  }>;
};

const Header = ({ wigId }: { wigId: string }) => (
  <header className="mb-4 grid grid-cols-3 gap-1">
    <Logo />
    <h1 className="text-xl text-center">תעלה תמונה של עצמך</h1>
    <div className="flex items-center justify-end gap-1">
      <Link href={`/wigs/${wigId}`} aria-label="חזרה">
        <ChevronLeft size={24} />
      </Link>
    </div>
  </header>
);

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
    <PageContainer className="p-4 h-[calc(100vh-2.5rem)] overflow-hidden flex flex-col">
      <Header wigId={wigId} />

      <div className="flex-1 min-h-0">
        <Suspense fallback={<div>Loading uploader...</div>}>
          <UploadPageClient wigId={wigId} wigImageUrl={wig.imageUrl} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
