import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PageContainer from '@/src/components/PageContainer';
import PageHeader from '@/src/components/PageHeader';
import CompareSlider from '@/src/components/ui/CompareSlider';
import Feedback from '@/src/components/Feedback';
import { getOptionalViewer } from '@/src/lib/api/auth';
import { ApiRouteError } from '@/src/lib/api/errors';
import { getHistoryDetail } from '@/src/services/history';
import DeleteTryOnButton from './DeleteTryOnButton';

const dateFormat = new Intl.DateTimeFormat('he-IL', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

export default async function TryOnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getOptionalViewer();

  if (!viewer.userId) {
    redirect(`/login?next=${encodeURIComponent(`/my-try-ons/${id}`)}`);
  }

  let detail;
  try {
    detail = await getHistoryDetail(id, viewer);
  } catch (error) {
    if (
      error instanceof ApiRouteError &&
      (error.status === 403 || error.status === 404)
    ) {
      notFound();
    }
    throw error;
  }

  if (detail.status !== 'completed' || !detail.resultImageUrl) {
    redirect(`/result?id=${encodeURIComponent(detail.id)}`);
  }

  return (
    <PageContainer className="p-4">
      <PageHeader title="הניסיון שלי" backHref="/my-try-ons" />
      <p className="mt-1 text-sm text-muted-foreground">
        {dateFormat.format(detail.createdAt)}
      </p>

      <div className="mt-4">
        <CompareSlider
          beforeUrl={`/api/photos/${encodeURIComponent(detail.photoId)}/image`}
          afterUrl={`/api/generations/${encodeURIComponent(detail.id)}/image`}
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
          <span>לפני</span>
          <span>אחרי</span>
        </div>
      </div>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">הפאה שנבחרה</h2>
        <Link href={`/wigs/${detail.wig.id}`} className="underline text-sm">
          {detail.wig.name}
        </Link>
        {detail.wig.price != null && (
          <p className="text-sm text-muted-foreground">₪{detail.wig.price}</p>
        )}
      </section>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">המשוב שלי</h2>
        <Feedback
          id={detail.id}
          initialMessage={detail.feedback?.message ?? ''}
        />
      </section>
    
      <DeleteTryOnButton id={detail.id} />
    </PageContainer>
  );
}
