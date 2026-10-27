import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getGenerationAlerts } from '@/src/services/admin-review';

export default async function AdminPage() {
  const alerts = await getGenerationAlerts();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      {alerts.counts.quota > 0 && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          Image generation credits have run out ({alerts.counts.quota} failed
          generation(s) this week).{' '}
          <Link href="/admin/alerts" className="underline">
            See alerts
          </Link>
        </p>
      )}

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

        <Card>
          <CardHeader>
            <CardTitle>Generation Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Failed, slow and out-of-credits generations from the last week
              ({alerts.total} total).
            </p>
            <Link href="/admin/alerts" className="text-sm font-medium underline">
              Open alerts
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Wigs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Edit wig details and manage up to five photos per wig.
            </p>
            <Link href="/admin/wigs" className="text-sm font-medium underline">
              Open wig list
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
