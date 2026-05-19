import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/src/lib/prisma';
import PageContainer from '@/src/components/PageContainer';
import PageHeader from '@/src/components/generationLoader/PageHeader';
import { getWig } from '@/src/services/wig';
import { getPhoto } from '@/src/services/photo';
import ResultPageClient from './ResultPageClient';

type ResultPageProps = {
  searchParams: Promise<{
    id?: string;
    wigId?: string;
  }>;
};

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const { id } = await searchParams;

  if (!id) {
    redirect('/catalog');
  }

  const generation = await prisma.generation.findUnique({
    where: { id },
  });

  if (!generation) {
    notFound();
  }

  if (!generation.resultImageUrl) {
    return (
      <PageContainer className="p-4">
        <h1 className="text-xl font-semibold">Your Result</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your image is still being generated. Please refresh this page in a few
          seconds.
        </p>
      </PageContainer>
    );
  }

  const wigId = generation.wigId;
  const [wig, photo] = await Promise.all([
    getWig(wigId),
    getPhoto(generation.photoId),
  ]);

  const wigName = wig?.name || 'Selected wig';
  const wigImageUrl = wig?.imageUrl || '';
  const whatsappPhone = process.env.WHATSAPP_PHONE;

  return (
    <PageContainer className="p-4">
      <PageHeader title="התוצאה שלך" backHref={`upload?wigId=${wigId}`} />
      <ResultPageClient
        generationId={generation.id}
        wigName={wigName}
        wigImageUrl={wigImageUrl}
        photoImageUrl={photo.imageUrl || ''}
        resultImageUrl={generation.resultImageUrl}
        whatsappPhone={whatsappPhone}
      />
    </PageContainer>
  );
}
