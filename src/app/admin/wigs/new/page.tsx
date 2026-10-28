import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { WigForm } from '../WigForm';

export default function NewWigPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Wig to Catalog</CardTitle>
        </CardHeader>

        <CardContent>
          <WigForm />
        </CardContent>
      </Card>
    </main>
  );
}
