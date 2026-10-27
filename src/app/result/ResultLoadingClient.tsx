'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils';
import WigMarquee from '@/src/components/generationLoader/WigMarquee';
import { Button } from '@/src/components/ui/button';

type Props = {
  generationId: string;
  wigId: string;
  wigName: string;
  wigImageUrl: string;
  photoImageUrl: string;
  wigImages: string[];
};

const STEPS = [
  { label: 'מעלה את התמונה שלך', endAt: 8 },
  { label: 'מזהה מאפייני פנים', endAt: 23 },
  { label: 'מחיל את סגנון הפאה', endAt: 45 },
  { label: 'מייעל את התוצאה הסופית', endAt: 60 },
];

const TIPS = [
  'הבינה המלאכותית מנתחת אלפי פרטים כדי להתאים את הפאה בצורה מושלמת',
  'כל תוצאה מותאמת לצבע עור, תאורה ומבנה הפנים שלך',
  'תהליך היצירה לוקח כ-60 שניות — שווה לחכות!',
  'ניתן לשלוח את התוצאה ישירות לוואטסאפ שלנו',
];

const TOTAL_SECONDS = 65;
const SLOW_AFTER_SECONDS = 120;

// Shown when generation fails. The admin is alerted automatically (see the
// admin alerts page), so the customer is told to simply try again later.
const FAILURE_COPY: Record<string, { title: string; body: string }> = {
  quota: {
    title: 'השירות לא זמין כרגע',
    body: 'הגענו למגבלת השימוש של שירות יצירת התמונות. עדכנו את צוות האתר. נסי שוב מאוחר יותר.',
  },
  timeout: {
    title: 'זה לוקח יותר מדי זמן',
    body: 'היצירה לא הסתיימה בזמן. עדכנו את צוות האתר. נסי שוב מאוחר יותר.',
  },
  error: {
    title: 'משהו השתבש',
    body: 'לא הצלחנו ליצור את התוצאה. נסי שוב, ואם זה חוזר, נסי שוב מאוחר יותר.',
  },
};

export default function ResultLoadingClient({
  generationId,
  wigId,
  wigImages,
}: Props) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const done = false;
  const [failed, setFailed] = useState(false);
  const [failureReason, setFailureReason] = useState<string>('error');
  const startRef = useRef<number>(0);

  const progressValue = done
    ? 100
    : Math.min((elapsed / TOTAL_SECONDS) * 95, 95);
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);

  useEffect(() => {
    startRef.current = Date.now();

    const timerInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    const tipInterval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        setTipVisible(true);
      }, 350);
    }, 8000);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generation?id=${generationId}`);
        if (res.status === 401) {
          clearInterval(timerInterval);
          clearInterval(tipInterval);
          clearInterval(pollInterval);
          router.push(
            `/login?next=${encodeURIComponent(`/result?id=${generationId}`)}`,
          );
          return;
        }
        if (res.status === 403) {
          clearInterval(timerInterval);
          clearInterval(tipInterval);
          clearInterval(pollInterval);
          setFailed(true);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(timerInterval);
          clearInterval(tipInterval);
          clearInterval(pollInterval);
          window.location.href = `/result?id=${generationId}`;
        } else if (data.status === 'failed') {
          setFailureReason(data.failureReason ?? 'error');
          clearInterval(timerInterval);
          clearInterval(tipInterval);
          clearInterval(pollInterval);
          setFailed(true);
        }
      } catch {
        // ignore transient network errors, poll again next tick
        console.error('Error polling generation status');
      }
    }, 3500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(tipInterval);
      clearInterval(pollInterval);
    };
  }, [generationId, router]);

  const failureCopy = FAILURE_COPY[failureReason] ?? FAILURE_COPY.error;

  if (failed) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4 text-center p-8">
        <p className="text-xl font-medium">{failureCopy.title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {failureCopy.body}
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <a href={`/upload?wigId=${wigId}`}>נסי שוב</a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">לדף הבית</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed py-2 inset-0 z-50 bg-white flex flex-col overflow-hidden">
      <WigMarquee images={wigImages} direction="left" />

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 overflow-y-auto">
        <p className="text-2xl tracking-[0.3em] font-light">RACHELI</p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {STEPS.map((step, i) => {
            const prevEndAt = i > 0 ? STEPS[i - 1].endAt : 0;
            const isCompleted = elapsed >= step.endAt;
            const isActive = !isCompleted && elapsed >= prevEndAt;

            return (
              <div key={i} className="flex items-center gap-3">
                <StepDot completed={isCompleted} active={isActive} />
                <span
                  className={cn(
                    'text-sm transition-colors duration-300',
                    isCompleted
                      ? 'text-secondary-foreground font-medium'
                      : isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary-foreground rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${progressValue}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {elapsed >= SLOW_AFTER_SECONDS
            ? 'זה לוקח יותר מהרגיל. עוד רגע... אפשר להישאר בעמוד.'
            : done
            ? 'מוכן! מעביר לתוצאה...'
            : remaining > 0
              ? `כ-${remaining} שניות נותרו`
              : 'כמעט מוכן...'}
        </p>

        <p
          className={cn(
            'text-xs text-center text-muted-foreground px-2 max-w-xs transition-opacity duration-300',
            tipVisible ? 'opacity-100' : 'opacity-0',
          )}
        >
          {TIPS[tipIndex]}
        </p>
      </div>

      <WigMarquee images={wigImages} direction="right" />
    </div>
  );
}

function StepDot({
  completed,
  active,
}: {
  completed: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300',
        completed
          ? 'bg-secondary-foreground'
          : active
            ? 'bg-secondary-foreground/40 animate-pulse'
            : 'bg-muted',
      )}
    >
      {completed && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M1 4L3 6L7 2"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
