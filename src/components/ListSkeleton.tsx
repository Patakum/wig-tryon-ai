import CatalogHeader from '@/src/app/catalog/CatalogHeader';
import PageContainer from '@/src/components/PageContainer';
import { Skeleton } from '@/src/components/ui/skeleton';

// Shown by loading.tsx while a list page renders on the server, so the page
// does not flash blank.
export default function ListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <PageContainer>
      <CatalogHeader />
      <div className="p-3" role="status" aria-label="טוען">
        <Skeleton className="mb-4 h-9 w-full" />
        <ul className="grid grid-cols-2 gap-3 list-none">
          {Array.from({ length: cards }, (_, index) => (
            <li key={index}>
              <Skeleton className="aspect-4/5 w-full rounded-xl" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-3 w-1/3" />
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  );
}
