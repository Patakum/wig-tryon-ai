import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              See all user feedback messages with their related generations.
            </p>
            <Link
              href="/admin/feedbacks"
              className="text-sm font-medium underline"
            >
              Open feedbacks page
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Wig</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Add a new wig item to the catalog so users can pick it.
            </p>
            <Link
              href="/admin/wigs/new"
              className="text-sm font-medium underline"
            >
              Open add wig page
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
