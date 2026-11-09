import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  FAILURE_LABELS,
  getGenerationAlerts,
} from '@/src/services/admin-review';

export default async function AdminAlertsPage() {
  const alerts = await getGenerationAlerts();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <Link href="/admin" className="text-sm underline">
        Back to dashboard
      </Link>
      <h1 className="text-2xl font-semibold">Generation alerts</h1>
      <p className="text-sm text-muted-foreground">
        Failed generations in the last {alerts.windowDays} days. Customers saw
        a &quot;try again later&quot; message for each of these.
      </p>

      {alerts.counts.quota > 0 && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {alerts.counts.quota} generation(s) failed because the image provider
          credits ran out. Add credits, then customers can try again.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {(['quota', 'timeout', 'error'] as const).map((reason) => (
          <Card key={reason}>
            <CardHeader>
              <CardTitle className="text-sm">{FAILURE_LABELS[reason]}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {alerts.counts[reason]}
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No failures. All good.</p>
      ) : (
        <ul className="list-none space-y-2">
          {alerts.recent.map((alert) => (
            <li
              key={alert.id}
              className="flex items-center justify-between rounded border p-3 text-sm"
            >
              <span>
                {FAILURE_LABELS[alert.reason] ?? alert.reason} · {alert.wigName}
              </span>
              <time dateTime={alert.createdAt.toISOString()} className="text-muted-foreground">
                {alert.createdAt.toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
