import { redirect } from 'next/navigation';
import CatalogHeader from '@/src/app/catalog/CatalogHeader';
import Footer from '@/src/components/Footer';
import PageContainer from '@/src/components/PageContainer';
import { getOptionalUser } from '@/src/lib/api/auth';
import { getHistoryForUser } from '@/src/services/history';
import DeleteAllTryOnsButton from './DeleteAllTryOnsButton';
import HistoryList from './HistoryList';

export default async function MyTryOnsPage() {
  const user = await getOptionalUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/my-try-ons')}`);
  }

  const firstPage = await getHistoryForUser(user.id);

  return (
    <PageContainer>
      <CatalogHeader />
      <div className="p-3">
        <h2 className="mb-3 text-lg">הניסיונות שלי</h2>
        <HistoryList initialPage={firstPage} />
        {firstPage.items.length > 0 && <DeleteAllTryOnsButton />}
      </div>
      <Footer />
    </PageContainer>
  );
}
