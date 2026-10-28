import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import WigGrid from '@/src/components/WigGrid';
import { getWigs } from '@/src/services/wig';

export default async function AdminPage() {
  const wigs = await getWigs();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/feedbacks">Feedbacks</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/wigs/new">Add new wig</Link>
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">All wigs ({wigs.length})</h2>
        {wigs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No wigs yet.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Choose a wig to edit it
            </p>
            <WigGrid wigs={wigs} hrefPrefix="/admin/wigs" />
          </>
        )}
      </section>
    </main>
  );
}
