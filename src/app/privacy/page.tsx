import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import Footer from '@/src/components/Footer';
import PageContainer from '@/src/components/PageContainer';
import PageHeader from '@/src/components/PageHeader';
import { createWhatsAppLink } from '@/src/lib/whatsapp';
import {
  ACCOUNT_RETENTION_DAYS,
  GUEST_RETENTION_HOURS,
  TOMBSTONE_RETENTION_HOURS,
} from '@/src/lib/retention-policy';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות | Racheli Wig AI',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-stone-800">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  // The retention numbers come from the same constants the daily cleanup job
  // uses, so this text matches what is actually enforced.
  const accountMonths = Math.round(ACCOUNT_RETENTION_DAYS / 30);
  const phone = process.env.WHATSAPP_PHONE;
  const whatsappLink = phone
    ? createWhatsAppLink({
        phone,
        message: 'שלום, יש לי שאלה לגבי הפרטיות והתמונות שלי באתר.',
      })
    : null;

  return (
    <PageContainer className="p-4">
      <div className="mx-auto max-w-prose">
        <PageHeader title="מדיניות פרטיות" backHref="/" />

        <p className="text-sm leading-relaxed text-stone-800">
          האתר מאפשר לראות איך פאה נראית עלייך. כדי לעשות זאת אנחנו מעבדות
          תמונה שלך. כאן מוסבר בפשטות מה נשמר, אצל מי, לכמה זמן, ואיך אפשר למחוק.
        </p>

        <Section title="איזה מידע אנחנו שומרות">
          <ul className="list-disc ps-5 space-y-1">
            <li>התמונה שהעלית או צילמת, והתוצאה שנוצרה ממנה.</li>
            <li>הפאה שבחרת, ומשוב שכתבת על התוצאה.</li>
            <li>
              למי שנרשמה: שם, כתובת אימייל, והפאות ששמרת במועדפים. אורחות
              מזוהות רק באמצעות קובץ עוגייה טכני בדפדפן.
            </li>
          </ul>
        </Section>

        <Section title="למה אנחנו משתמשות בו">
          <p>
            רק כדי ליצור את הדמיית הפאה ולהציג לך אותה. איננו משתמשות
            בתמונות שלך לפרסום או לתיק עבודות ללא אישור מפורש ממך.
          </p>
        </Section>

        <Section title="מי מעבד את התמונה">
          <p>כדי לספק את השירות אנחנו נעזרות בספקים חיצוניים:</p>
          <ul className="list-disc ps-5 space-y-1">
            <li>Cloudinary – אחסון פרטי של התמונות והתוצאות.</li>
            <li>OpenAI – יצירת תמונת התוצאה.</li>
            <li>Replicate – זיהוי אזור השיער בתמונה (כאשר האפשרות פעילה).</li>
            <li>שירותי האחסון של האתר ומסד הנתונים.</li>
          </ul>
          <p>
            התמונה נשלחת לספקים אלה רק לצורך יצירת התוצאה, והם מעבדים אותה
            בהתאם לתנאים שלהם.
          </p>
        </Section>

        <Section title="כמה זמן המידע נשמר">
          <ul className="list-disc ps-5 space-y-1">
            <li>
              אורחות (ללא התחברות): התמונה והתוצאה נמחקות אוטומטית אחרי{' '}
              {GUEST_RETENTION_HOURS} שעות. אם מתחברות בזמן, הן נשמרות בחשבון.
            </li>
            <li>
              משתמשות רשומות: ניסיון נשמר עד שתמחקי אותו, ולכל היותר{' '}
              {accountMonths} חודשים מיום היצירה, ואז נמחק אוטומטית.
            </li>
            <li>
              כשמוחקים ניסיון, התמונה והתוצאה נמחקות מיד. רישום טכני מינימלי
              ללא תמונה נשמר עד {TOMBSTONE_RETENTION_HOURS} שעות לצורך מגבלת
              הניסיונות היומית.
            </li>
          </ul>
        </Section>

        <Section title="מי יכול לראות את התמונות שלי">
          <ul className="list-disc ps-5 space-y-1">
            <li>רק את, כשאת מחוברת (או באותו דפדפן, אם את אורחת).</li>
            <li>
              כשאת שולחת משוב, מנהלי האתר יכולים לראות אותו, ובברירת מחדל גם
              את התמונה והתוצאה כדי להבין את המשוב. אפשר לכבות זאת לכל ניסיון
              בנפרד בעמוד הניסיון, בהגדרות הפרטיות.
            </li>
            <li>התמונות אינן נגישות בקישור ציבורי.</li>
          </ul>
        </Section>

        <Section title="מחיקה וזכויות">
          <ul className="list-disc ps-5 space-y-1">
            <li>
              אפשר למחוק ניסיון אחד, או את כל הניסיונות, בעמוד{' '}
              <Link href="/my-try-ons" className="underline">
                הניסיונות שלי
              </Link>
              .
            </li>
            <li>
              לשאלות, לבקשת עיון או למחיקת חשבון אפשר לפנות אלינו
              {whatsappLink ? (
                <>
                  {' '}
                  ב-
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    WhatsApp
                  </a>
                </>
              ) : null}
              {' '}או דרך פרטי הקשר שבתחתית האתר.
            </li>
          </ul>
        </Section>

        <Section title="אישור לפני העלאה">
          <p>
            לפני העלאת תמונה תתבקשי לאשר שקראת מדיניות זו. האישור נרשם יחד עם
            התמונה.
          </p>
        </Section>
      </div>
      <Footer />
    </PageContainer>
  );
}
