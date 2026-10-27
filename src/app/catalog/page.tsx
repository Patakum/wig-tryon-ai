import CatalogHeader from './CatalogHeader';
import CatalogResults from './CatalogResults';
import CatalogSearchBar from './CatalogSearchBar';
import Footer from '@/src/components/Footer';
import PageContainer from '@/src/components/PageContainer';
import {
  parseCatalogSearchParams,
  searchWigs,
} from '@/src/services/catalog';

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  // The first page never starts from a cursor; "load more" handles the rest.
  const query = { ...parseCatalogSearchParams(await searchParams), cursor: undefined };
  const firstPage = await searchWigs(query);

  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.min !== undefined) params.set('min', String(query.min));
  if (query.max !== undefined) params.set('max', String(query.max));
  if (query.sort !== 'newest') params.set('sort', query.sort);

  const queryString = params.toString();

  return (
    <PageContainer>
      <CatalogHeader />
      <CatalogSearchBar query={query} />
      <div className="p-3">
        {/* Remount on a new search so list state never mixes queries. */}
        <CatalogResults
          key={queryString}
          initialPage={firstPage}
          queryString={queryString}
          isFiltered={queryString !== ''}
        />
      </div>
      <Footer />
    </PageContainer>
  );
}
