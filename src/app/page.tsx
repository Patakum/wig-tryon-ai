import WigCard from '@/src/components/WigCard';
import { getLatestWigs } from '@/src/services/wig';
import { Wig } from '@/src/types';
import Footer from '../components/Footer';
import HeroSection from './HeroSection';
import PageContainer from '@/src/components/PageContainer';
import SectionHeader from '@/src/components/SectionHeader';

function WigSection({
  title,
  wigs,
  viewAllLink,
}: {
  title: string;
  wigs: Wig[];
  viewAllLink?: string;
}) {
  if (wigs.length === 0) return null;

  return (
    <section>
      <SectionHeader title={title} viewAllLink={viewAllLink} />
      <ul className="grid grid-cols-2 gap-4 px-4 py-6 list-none">
        {wigs.map((wig) => (
          <li key={wig.id}>
            <WigCard {...wig} href={`/wigs/${wig.id}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Home() {
  const wigs = await getLatestWigs(8);

  return (
    <PageContainer className="font-sans">
      <HeroSection />
      <WigSection
        title="המוצרים הכי שווים"
        wigs={wigs.slice(0, 2)}
        viewAllLink="/catalog"
      />
      <WigSection title="מבצעים חמים" wigs={wigs.slice(2, 4)} />
      <WigSection title="מוצרים חדשים" wigs={wigs.slice(4, 8)} />
      <Footer />
    </PageContainer>
  );
}
