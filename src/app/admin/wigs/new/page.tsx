import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { WigFormClient } from './WigFormClient';

async function createWig(
  name: string,
  imageUrl: string,
  description: string | null,
  price: number | null,
) {
  'use server';

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    redirect('/catalog');
  }

  if (!name || !imageUrl) {
    throw new Error('missing-fields');
  }

  if (price !== null && Number.isNaN(price)) {
    throw new Error('invalid-price');
  }

  await prisma.wig.create({
    data: {
      name,
      imageUrl,
      description,
      price,
    },
  });

  revalidatePath('/catalog');
}

export default async function NewWigPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Wig to Catalog</CardTitle>
        </CardHeader>

        <CardContent>
          <WigFormClient
            onCreateWig={createWig}
            successMessage={params.success === '1'}
            errorType={params.error}
          />
        </CardContent>
      </Card>
    </main>
  );
}
