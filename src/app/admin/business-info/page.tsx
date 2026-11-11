import BackButton from '@/src/components/BackButton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { BusinessInfoFormClient } from './BusinessInfoFormClient';

export default async function BusinessInfoPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="mb-2 flex justify-end">
        <BackButton href="/admin" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>

        <CardContent>
          <BusinessInfoFormClient />
        </CardContent>
      </Card>
    </main>
  );
}
