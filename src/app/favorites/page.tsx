import { redirect } from 'next/navigation';
import CatalogHeader from '@/src/app/catalog/CatalogHeader';
import Footer from '@/src/components/Footer';
import PageContainer from '@/src/components/PageContainer';
import { getOptionalUser } from '@/src/lib/api/auth';
import { getFavoriteWigs } from '@/src/services/favorite';
import FavoritesGrid from './FavoritesGrid';

export default async function FavoritesPage() {
  const user = await getOptionalUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/favorites')}`);
  }

  const wigs = await getFavoriteWigs(user.id);

  return (
    <PageContainer>
      <CatalogHeader />
      <div className="p-3">
        <FavoritesGrid initialWigs={wigs} />
      </div>
      <Footer />
    </PageContainer>
  );
}
