import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getWig } from '@/src/services/wig';
import { getWigImages } from '@/src/services/wig-image';
import WigDetailClient from './WigDetailClient';
import WigActionButtons from './WigActionButtons';
import PageContainer from '@/src/components/PageContainer';
import WigGallery from '@/src/components/WigGallery';

function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="relative w-full bg-gray-50">
      <WigDetailClient />
      <Image
        src={src}
        alt={alt}
        width={400}
        height={500}
        className="w-full h-auto object-cover rounded-xl"
        priority
        unoptimized
      />
    </figure>
  );
}

function ProductInfo({
  name,
  description,
  wigPrice,
  color,
  length,
  material,
}: {
  name: string;
  description?: string | null;
  wigPrice?: number | string | null;
  color?: string | null;
  length?: string | null;
  material?: string | null;
}) {
  return (
    <section className="px-2 pt-5 pb-4 space-y-2">
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">{name}</h1>

      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1">
          <span className="text-yellow-400">★</span>
          <span className="font-semibold text-gray-900">5.0</span>
        </div>
        <span className="text-gray-500 text-sm">(57 ביקורות)</span>
      </div>

      {description && (
        <p className="text-gray-700 text-sm leading-relaxed">
          <span className="font-semibold">תיאור:</span> {description}
        </p>
      )}

      {color && (
        <p className="text-gray-700 text-sm leading-relaxed">
          <span className="font-semibold">צבע:</span> {color}
        </p>
      )}

      {length && (
        <p className="text-gray-700 text-sm leading-relaxed">
          <span className="font-semibold">אורך:</span> {length}
        </p>
      )}

      {material && (
        <p className="text-gray-700 text-sm leading-relaxed">
          <span className="font-semibold">חומר:</span> {material}
        </p>
      )}

      {wigPrice && (
        <p className="text-gray-700 text-sm leading-relaxed">
          <span className="font-semibold">מחיר:</span> ₪{wigPrice}
        </p>
      )}
    </section>
  );
}

export default async function WigDetailPage({
  params,
}: {
  params: Promise<{ wigId: string }>;
}) {
  const { wigId } = await params;
  const wig = await getWig(wigId);
console.log(wig)
  if (!wig) {
    notFound();
  }

  const images = await getWigImages(wigId);

  return (
    <PageContainer className="p-4">
      {images.length > 0 ? (
        <WigGallery images={images} />
      ) : (
        <ProductImage src={wig.imageUrl} alt={wig.name} />
      )}
      <ProductInfo
        name={wig.name}
        description={wig.description}
        wigPrice={wig.price}
        color={wig.color}
        length={wig.length}
        material={wig.material}
      />
      <div className="h-36"></div>
    
      <WigActionButtons wigId={wig.id} />
    </PageContainer>
  );
}
