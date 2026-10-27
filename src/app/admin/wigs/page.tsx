import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { getWigsForAdmin } from '@/src/services/wig';

export default async function AdminWigsPage() {
  const wigs = await getWigsForAdmin();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Wigs</h1>
        <Link href="/admin/wigs/new" className="text-sm font-medium underline">
          Add new wig
        </Link>
      </div>

      {wigs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No wigs yet.</p>
      ) : (
        <ul className="space-y-3 list-none">
          {wigs.map((wig) => (
            <li key={wig.id}>
              <Card>
                <CardContent className="flex items-center gap-4 py-3">
                  <Image
                    src={wig.imageUrl}
                    alt={wig.name}
                    width={64}
                    height={80}
                    className="h-20 w-16 rounded object-cover"
                    unoptimized
                  />
                  <span className="flex-1 font-medium">
                    {wig.name}
                    {wig.archivedAt && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (archived)
                      </span>
                    )}
                  </span>
                  <Link
                    href={`/admin/wigs/${wig.id}`}
                    className="text-sm font-medium underline"
                  >
                    Edit
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
