import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import GenerateButton from '../../components/GenerateButton';
import { prisma } from '@/src/lib/prisma';

type PreviewPageProps = {
  searchParams: Promise<{
    photoId?: string;
    wigId?: string;
  }>;
};

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const { photoId, wigId } = await searchParams;

  if (!wigId) {
    redirect('/catalog');
  }

  if (!photoId) {
    redirect(`/upload?wigId=${wigId}`);
  }

  const [photo, wig] = await Promise.all([
    prisma.photo.findUnique({
      where: { id: photoId },
    }),
    prisma.wig.findUnique({
      where: { id: wigId },
    }),
  ]);

  if (!photo || !wig) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Confirm your selection</h1>
        <p className="text-sm text-muted-foreground">
          Review your uploaded photo and selected wig before generating the
          try-on.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Your photo</h2>
          <div className="overflow-hidden rounded-xl border bg-muted">
            <Image
              src={photo.imageUrl}
              alt="Uploaded selfie"
              width={1200}
              height={1200}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Selected wig</h2>
          <div className="overflow-hidden rounded-xl border bg-muted">
            <Image
              src={wig.imageUrl}
              alt={wig.name}
              width={1200}
              height={1200}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">{wig.name}</p>
            {wig.description ? (
              <p className="text-sm text-muted-foreground">{wig.description}</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border p-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Ready to generate</p>
          <p className="text-sm text-muted-foreground">Photo: {photoId}</p>
          <p className="text-sm text-muted-foreground">Wig: {wigId}</p>
        </div>

        <GenerateButton photoId={photoId} wigId={wigId} />
      </div>
    </main>
  );
}
