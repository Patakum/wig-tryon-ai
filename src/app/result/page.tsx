import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/src/lib/prisma';
import PageContainer from '@/src/components/PageContainer';
import PageHeader from '@/src/components/PageHeader';
import { getWig, getLatestWigs } from '@/src/services/wig';
import { getPhoto } from '@/src/services/photo';
import ResultPageClient from './ResultPageClient';
import ResultLoadingClient from './ResultLoadingClient';

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
console.log('Fetched generation:', generation);
  if (!generation) {
    notFound();
  }

  const wigId = generation.wigId;
  const [wig, photo, latestWigs] = await Promise.all([
    getWig(wigId),
    getPhoto(generation.photoId),
    getLatestWigs(12),
  ]);

  const wigName = wig?.name ?? 'Selected wig';
  const wigImageUrl = wig?.imageUrl ?? '';
  const wigImages = latestWigs.map((w) => w.imageUrl);

  if (!generation.resultImageUrl) {
    return (
      <PageContainer className="p-4">
        <PageHeader title="יוצרים את הפאה שלך..." backHref={`/upload?wigId=${wigId}`} />
        <ResultLoadingClient
          generationId={generation.id}
          wigId={wigId}
          wigName={wigName}
          wigImageUrl={wigImageUrl}
          photoImageUrl={photo.imageUrl}
          wigImages={wigImages}
        />
      </PageContainer>
    );
  }

  const whatsappPhone = process.env.WHATSAPP_PHONE;

  return (
    <PageContainer className="p-4">
      <PageHeader title="התוצאה שלך" backHref={`upload?wigId=${wigId}`} />
      <ResultPageClient
        generationId={generation.id}
        wigName={wigName}
        wigImageUrl={wigImageUrl}
        photoImageUrl={photo.imageUrl}
        resultImageUrl={generation.resultImageUrl}
        whatsappPhone={whatsappPhone}
      />
    </PageContainer>
  );
}
