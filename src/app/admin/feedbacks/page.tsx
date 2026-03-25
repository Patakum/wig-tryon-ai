import { prisma } from '@/src/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

export default async function AdminFeedbacksPage() {
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      generation: {
        include: {
          wig: true,
          photo: true,
        },
      },
    },
  });

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

            <CardContent className="space-y-2 flex">
              <p>{feedback.message}</p>

              <div className="text-sm text-muted-foreground">
                <p>Generation ID: {feedback.generation.id}</p>
                <p>Status: {feedback.generation.status}</p>
                <p>Wig: {feedback.generation.wig.name}</p>
              </div>
                {feedback.generation.resultImageUrl && (
                  <img
                    src={feedback.generation.resultImageUrl}
                    alt={`Result for ${feedback.generation.wig.name}`}
                    className="mt-2 max-h-48 w-auto rounded"
                  />
                )}
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
