import { notFound, redirect } from 'next/navigation';
import PageContainer from '@/src/components/PageContainer';
import PageHeader from '@/src/components/PageHeader';
import { getWig, getLatestWigs } from '@/src/services/wig';
import { getPhotoForViewer } from '@/src/services/photo';
import {
  getGenerationForViewer,
} from '@/src/services/generation';
import { ApiRouteError } from '@/src/lib/api/errors';
import { getOptionalViewer } from '@/src/lib/api/auth';
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

  const viewer = await getOptionalViewer();
  let generation;
  try {
    generation = await getGenerationForViewer(id, viewer);
  } catch (error) {
    if (error instanceof ApiRouteError && error.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/result?id=${id}`)}`);
    }
    if (error instanceof ApiRouteError && error.status === 404) {
      notFound();
    }
    if (error instanceof ApiRouteError && error.status === 403) {
      notFound();
    }
    throw error;
  }

  const wigId = generation.wigId;
  let photo;
  try {
    photo = await getPhotoForViewer(generation.photoId, viewer);
  } catch (error) {
    if (error instanceof ApiRouteError && error.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/result?id=${id}`)}`);
    }
    if (
      error instanceof ApiRouteError &&
      (error.status === 403 || error.status === 404)
    ) {
      notFound();
    }
    throw error;
  }
  const [wig, latestWigs] = await Promise.all([
    getWig(wigId),
    getLatestWigs(12),
  ]);

  const wigName = wig?.name ?? 'Selected wig';
  const wigImageUrl = wig?.imageUrl ?? '';
  const wigImages = latestWigs.map((w) => w.imageUrl);

  if (!generation.resultImageUrl) {
    return (
      <PageContainer className="p-4">
        <PageHeader
          title="יוצרים את הפאה שלך..."
          backHref={`/upload?wigId=${wigId}`}
        />
        <ResultLoadingClient
          generationId={generation.id}
          wigId={wigId}
          wigName={wigName}
          wigImageUrl={wigImageUrl}
          photoImageUrl={`/api/photos/${encodeURIComponent(photo.id)}/image`}
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
        photoImageUrl={`/api/photos/${encodeURIComponent(photo.id)}/image`}
        resultImageUrl={`/api/generations/${encodeURIComponent(generation.id)}/image`}
        whatsappPhone={whatsappPhone}
      />
    </PageContainer>
  );
}
