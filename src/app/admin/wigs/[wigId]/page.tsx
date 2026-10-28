import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getWig } from '@/src/services/wig';
import { WigForm } from '../WigForm';

export default async function EditWigPage({
  params,
}: {
  params: Promise<{ wigId: string }>;
}) {
  const { wigId } = await params;
  const wig = await getWig(wigId);

  if (!wig) notFound();

  return (
    <main className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit {wig.name}</CardTitle>
        </CardHeader>

        <CardContent>
          <WigForm wig={wig} />
        </CardContent>
      </Card>
    </main>
  );
}
