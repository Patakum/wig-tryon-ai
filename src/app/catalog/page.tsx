import CatalogHeader from './CatalogHeader';
import WigGrid from '@/src/components/WigGrid';
import Footer from '@/src/components/Footer';
import { getWigs } from '@/src/services/wig';
import PageContainer from '@/src/components/PageContainer';

export default async function CatalogPage() {
  const wigs = await getWigs();

  return (
    <PageContainer>
      <CatalogHeader />
      <div className="p-3">
        <WigGrid wigs={wigs} />
      </div>
      <Footer />
    </PageContainer>
  );
}
