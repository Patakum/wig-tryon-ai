import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { WigFormClient } from './WigFormClient';

export default async function NewWigPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Wig to Catalog</CardTitle>
        </CardHeader>

        <CardContent>
          <WigFormClient />
        </CardContent>
      </Card>
    </main>
  );
}
