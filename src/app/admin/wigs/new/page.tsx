import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/src/lib/prisma';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

async function createWig(formData: FormData) {
  'use server';

  const name = formData.get('name')?.toString().trim();
  const imageUrl = formData.get('imageUrl')?.toString().trim();
  const description = formData.get('description')?.toString().trim();
  const priceValue = formData.get('price')?.toString().trim();

  if (!name || !imageUrl) {
    redirect('/admin/wigs/new?error=missing-fields');
  }

  const price = priceValue ? Number(priceValue) : null;

  if (priceValue && Number.isNaN(price)) {
    redirect('/admin/wigs/new?error=invalid-price');
  }

  await prisma.wig.create({
    data: {
      name,
      imageUrl,
      description: description || null,
      price,
    },
  });

  revalidatePath('/catalog');
  revalidatePath('/admin/wigs/new');
  redirect('/admin/wigs/new?success=1');
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
          <form action={createWig} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-1">
              <label htmlFor="imageUrl" className="text-sm font-medium">
                Image URL
              </label>
              <Input id="imageUrl" name="imageUrl" required />
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input id="description" name="description" />
            </div>

            <div className="space-y-1">
              <label htmlFor="price" className="text-sm font-medium">
                Price (optional)
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
              />
            </div>

            <Button type="submit">Add Wig</Button>
          </form>

          {params.success === '1' && (
            <p className="mt-3 text-sm text-green-600">
              Wig added successfully.
            </p>
          )}
          {params.error === 'missing-fields' && (
            <p className="mt-3 text-sm text-red-600">
              Name and image URL are required.
            </p>
          )}
          {params.error === 'invalid-price' && (
            <p className="mt-3 text-sm text-red-600">
              Price must be a valid number.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
