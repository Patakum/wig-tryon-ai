import Image from 'next/image';
import Link from 'next/link';

type HomeWigCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  price?: number | null;
};

export default function HomeWigCard({ name, imageUrl, price }: HomeWigCardProps) {
  return (
    <Link href="/catalog" className="group block">
      <div className="overflow-hidden rounded-sm bg-stone-50">
        <Image
          src={imageUrl}
          alt={name}
          width={400}
          height={480}
          className="w-full aspect-4/5 object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm">{name}</p>
        {price != null && (
          <p className="text-sm text-muted-foreground">{price} ₪</p>
        )}
      </div>
    </Link>
  );
}
