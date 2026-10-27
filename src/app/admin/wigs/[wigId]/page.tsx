import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getWigForAdmin, MAX_WIG_PHOTOS } from '@/src/services/wig-photo';
import WigEditClient from './WigEditClient';

export default async function AdminEditWigPage({
  params,
}: {
  params: Promise<{ wigId: string }>;
}) {
  const { wigId } = await params;
  const wig = await getWigForAdmin(wigId);

  if (!wig) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <Link href="/admin/wigs" className="text-sm underline">
        Back to wigs
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Edit wig</CardTitle>
        </CardHeader>
        <CardContent>
          <WigEditClient
            wig={{
              id: wig.id,
              name: wig.name,
              description: wig.description,
              price: wig.price,
              archived: wig.archivedAt !== null,
            }}
            photos={wig.photos}
            maxPhotos={MAX_WIG_PHOTOS}
          />
        </CardContent>
      </Card>
    </main>
  );
}
