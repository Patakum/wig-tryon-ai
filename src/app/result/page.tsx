import { notFound, redirect } from 'next/navigation';
import { createWhatsAppLink } from '@/src/lib/whatsapp';
import { prisma } from '@/src/lib/prisma';

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
      <div className="p-4">
        <h1 className="text-xl font-semibold">Your Result</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your image is still being generated. Please refresh this page in a few
          seconds.
        </p>
      </div>
    );
  }

  const wigId = generation.wigId;
  const wig = await prisma.wig.findUnique({
    where: { id: wigId },
  });

  const wigName = wig?.name || 'Selected wig';
  const wigImageUrl = wig?.imageUrl || '';
  const whatsappPhone = process.env.WHATSAPP_PHONE;

  const whatsappLink = whatsappPhone
    ? createWhatsAppLink({
        phone: whatsappPhone,
        message: `Hi, I chose the wig \"${wigName}\". Wig image: ${wigImageUrl}. Generated result: ${generation.resultImageUrl}`,
      })
    : null;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Your Result</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Selected wig: {wigName}
      </p>

      <img
        src={generation.resultImageUrl}
        alt="result"
        className="mt-4 rounded-xl"
      />

      {whatsappLink ? (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Send to WhatsApp
        </a>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Set WHATSAPP_PHONE in your environment to enable WhatsApp sharing.
        </p>
      )}
    </div>
  );
}
