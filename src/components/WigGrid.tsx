import { Wig } from '@/src/types';
import WigCard from '@/src/components/WigCard';

export default function WigGrid({
  wigs,
  hrefPrefix = '/wigs',
}: {
  wigs: Wig[];
  hrefPrefix?: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 list-none">
      {wigs.map((wig) => (
        <li key={wig.id}>
          <WigCard {...wig} href={`${hrefPrefix}/${wig.id}`} />
        </li>
      ))}
    </ul>
  );
}
