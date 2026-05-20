'use client';

import CompareSlider from '@/src/components/ui/CompareSlider';
import Feedback from '@/src/components/Feedback';
import { createWhatsAppLink } from '@/src/lib/whatsapp';

type ResultPageClientProps = {
  generationId: string;
  wigName: string;
  wigImageUrl: string;
  photoImageUrl: string;
  resultImageUrl: string;
  whatsappPhone?: string;
};

export default function ResultPageClient({
  generationId,
  wigName,
  wigImageUrl,
  photoImageUrl,
  resultImageUrl,
  whatsappPhone,
}: ResultPageClientProps) {
  const whatsappLink = whatsappPhone
    ? createWhatsAppLink({
        phone: whatsappPhone,
        message: `Hi, I chose the wig "${wigName}". Wig image: ${wigImageUrl}. Generated result: ${resultImageUrl}`,
      })
    : null;

  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">
        הפאה שנבחרה: {wigName}
      </p>

      <div className="mt-4">
        <CompareSlider
          beforeUrl={photoImageUrl || wigImageUrl}
          afterUrl={resultImageUrl}
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
          <span>לפני</span>
          <span>אחרי</span>
        </div>
      </div>

      {whatsappLink ? (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-full bg-secondary-foreground px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          שליחת הודעה ב WhatsApp
        </a>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Set WHATSAPP_PHONE in your environment to enable WhatsApp sharing.
        </p>
      )}

      <Feedback id={generationId} />

      <p className="mt-4 text-xs bg-amber-200 p-2 rounded">
        *התוצאות הן להמחשה בלבד ותלויות באיכות התמונה שהועלתה ובבחירת הפאה.
        ייתכן שהתוצאה לא תדמה במדויק את המראה האמיתי של הפאה על הראש.
      </p>
    </>
  );
}
