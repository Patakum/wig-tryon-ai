import Image from 'next/image';
import Link from 'next/link';

type WigCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  price?: number | null;
  href: string;
};

export default function WigCard({ name, imageUrl, price, href }: WigCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden rounded-xl">
        <Image
          src={imageUrl}
          alt={name}
          width={300}
          height={400}
          className="w-full aspect-4/5 object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="mt-1 flex flex-col">
        <h3 className="text-sm">{name}</h3>
        {price != null && (
          <p className="text-sm text-muted-foreground">{price} ₪</p>
        )}
      </div>
    </Link>
  );
}
