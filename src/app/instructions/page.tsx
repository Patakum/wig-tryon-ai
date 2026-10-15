import { redirect } from 'next/navigation';
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import PageContainer from '@/src/components/PageContainer';
import { prisma } from '@/src/lib/prisma';

type InstructionsPageProps = {
  searchParams: Promise<{
    wigId?: string;
  }>;
};

export default async function InstructionsPage({
  searchParams,
}: InstructionsPageProps) {
  const { wigId } = await searchParams;

  if (!wigId) {
    redirect('/catalog');
  }

  const wig = await prisma.wig.findUnique({ where: { id: wigId } });

  if (!wig) {
    redirect('/catalog');
  }

  return (
    <PageContainer className="p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/wigs/${wigId}`}>
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center">תנסי בעצמך</h1>

        {/* Instructions Grid */}
        <div className="space-y-4 mb-8">
          <InstructionCard
            good
            title="הפנים נראים בבירור"
            description="וודאי שהפנים שלך ברורים ונראים היטב"
          />
          <InstructionCard
            good={false}
            title="קשה לראות את הפנים"
            description="הימנעי מתמונות שבהן הפנים אינם נראים בבירור"
          />

          <InstructionCard
            good
            title="תאורה טובה"
            description="בחרי תמונה עם תאורה טבעית וטובה"
          />
          <InstructionCard
            good={false}
            title="תאורה רעה"
            description="הימנעי מצללים או אור חלש"
          />

          <InstructionCard
            good
            title="הפנים מכוונים ישר אל המצלמה"
            description="קחי תמונה עם הפנים מכוונים ישר אל המצלמה"
          />
          <InstructionCard
            good={false}
            title="הפנים מסובבים"
            description="הימנעי מתמונות עם הפנים מסובבים"
          />

          <InstructionCard
            good
            title="ללא כובע ומשקפי שמש"
            description="ודאי שאין כובע או משקפי שמש על הפנים"
          />
          <InstructionCard
            good={false}
            title="עם כובע ומשקפיים"
            description="הימנעי מתמונות עם אביזרים המסתירים את הפנים"
          />
        </div>

        {/* Continue Button */}
        <Link href={`/upload?wigId=${wigId}`}>
          <Button className="w-full h-12 rounded-full text-white font-semibold">
            המשיכי
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}

interface InstructionCardProps {
  good: boolean;
  title: string;
  description: string;
}

function InstructionCard({ good, title, description }: InstructionCardProps) {
  return (
    <div
      className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
        good
          ? 'border-green-500 bg-green-50'
          : 'border-red-500 bg-red-50'
      }`}
    >
      <div className="flex-shrink-0 pt-1">
        {good ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <XCircle className="w-6 h-6 text-red-500" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}
