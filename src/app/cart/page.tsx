import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import CatalogHeader from '@/src/app/catalog/CatalogHeader';
import Footer from '@/src/components/Footer';
import PageContainer from '@/src/components/PageContainer';
import { Button } from '@/src/components/ui/button';
import { createWhatsAppLink } from '@/src/lib/whatsapp';

export const metadata: Metadata = {
  title: 'עגלה | Racheli Wig AI',
};

export default function CartPage() {
  const phone = process.env.WHATSAPP_PHONE;
  const whatsappLink = phone
    ? createWhatsAppLink({
        phone,
        message: 'שלום, אשמח לשמוע עוד על הפאות שלכם.',
      })
    : null;

  return (
    <PageContainer>
      <CatalogHeader />
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <ShoppingBag size={48} className="text-stone-500" aria-hidden="true" />
        <h2 className="text-xl font-semibold">העגלה בדרך</h2>
        <p className="max-w-xs text-sm text-stone-700">
          בקרוב תוכלי לרכוש ישירות מהאתר. בינתיים אפשר להמשיך לנסות פאות, ולפנות
          אלינו אם משהו מצא חן בעינייך.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/catalog">לקטלוג הפאות</Link>
          </Button>
          {whatsappLink && (
            <Button asChild size="lg" variant="outline">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
      <Footer />
    </PageContainer>
  );
}
