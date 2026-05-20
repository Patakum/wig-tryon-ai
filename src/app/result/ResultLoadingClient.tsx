'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

export default function ResultLoadingClient({
  generationId,
  wigId,
  wigName,
  wigImageUrl,
  photoImageUrl,
  wigImages,
}: Props) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
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
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(timerInterval);
          clearInterval(tipInterval);
          clearInterval(pollInterval);
          setDone(true);
          setTimeout(() => router.refresh(), 600);
        } else if (data.status === 'failed') {
          clearInterval(timerInterval);
          clearInterval(tipInterval);
          clearInterval(pollInterval);
          setFailed(true);
        }
      } catch {
        // ignore transient network errors, poll again next tick
      }
    }, 3500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(tipInterval);
      clearInterval(pollInterval);
    };
  }, [generationId, router]);

  if (failed) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4 text-center p-8">
        <p className="text-xl font-medium">משהו השתבש</p>
        <p className="text-sm text-muted-foreground">
          לא הצלחנו ליצור את התוצאה. אנא נסה שוב.
        </p>
        <Button asChild>
          <a href={`/upload?wigId=${wigId}`}>נסה שוב</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      <WigMarquee images={wigImages} direction="left" />

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 overflow-y-auto">
        <p className="text-2xl tracking-[0.3em] font-light">RACHELI</p>

        <div className="flex gap-6 justify-center">
          <Thumb src={photoImageUrl} label="לפני" />
          <Thumb src={wigImageUrl} label={wigName} />
        </div>

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

        <p className="text-xs text-muted-foreground">
          {done
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

function Thumb({ src, label }: { src: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-20 h-24 rounded-xl overflow-hidden border border-border shadow-sm">
        <Image
          src={src}
          alt={label}
          width={80}
          height={96}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
      <span className="text-xs text-muted-foreground text-center w-20 truncate">
        {label}
      </span>
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
