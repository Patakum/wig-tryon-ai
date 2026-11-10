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
