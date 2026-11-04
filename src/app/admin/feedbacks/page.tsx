import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getFeedbackForAdmin } from '@/src/services/admin-review';

type Visibility = { visible: boolean; hiddenByCustomer: boolean };

function ImageSlot({
  label,
  src,
  visibility,
}: {
  label: string;
  src: string | null;
  visibility: Visibility;
}) {
  return (
    <figure className="w-32 shrink-0">
      <figcaption className="mb-1 text-xs text-muted-foreground">
        {label}
      </figcaption>
      {src && visibility.visible ? (
        <Image
          src={src}
          alt={label}
          width={256}
          height={320}
          className="h-40 w-32 rounded object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-40 w-32 items-center justify-center rounded bg-gray-100 p-2 text-center text-xs text-muted-foreground">
          {visibility.hiddenByCustomer ? 'Hidden by the customer' : 'No image'}
        </div>
      )}
    </figure>
  );
}

export default async function AdminFeedbacksPage() {
  const feedbacks = await getFeedbackForAdmin();

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">All Feedbacks</h1>

      {feedbacks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No feedbacks yet.</p>
      ) : (
        feedbacks.map((feedback) => (
          <Card key={feedback.id}>
            <CardHeader>
              <CardTitle className="text-base">{feedback.user.email}</CardTitle>
              <CardDescription>
                Feedback date: {new Date(feedback.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <p>{feedback.message}</p>

              <div className="text-sm text-muted-foreground">
                <p>Generation ID: {feedback.generation.id}</p>
                <p>Status: {feedback.generation.status}</p>
                <p>Wig: {feedback.generation.wig.name}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <ImageSlot
                  label="Wig"
                  src={feedback.generation.wig.imageUrl}
                  visibility={{ visible: true, hiddenByCustomer: false }}
                />
                <ImageSlot
                  label="Customer photo"
                  src={`/api/admin/generations/${encodeURIComponent(feedback.generation.id)}/selfie`}
                  visibility={feedback.generation.selfie}
                />
                <ImageSlot
                  label="Result"
                  src={`/api/admin/generations/${encodeURIComponent(feedback.generation.id)}/result`}
                  visibility={feedback.generation.result}
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
