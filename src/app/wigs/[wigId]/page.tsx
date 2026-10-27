import type { ComponentProps } from 'react';
import { notFound } from 'next/navigation';
import { getOptionalUser } from '@/src/lib/api/auth';
import { isFavorite } from '@/src/services/favorite';
import { getWig } from '@/src/services/wig';
import WigDetailClient from './WigDetailClient';
import WigActionButtons from './WigActionButtons';
import WigGallery from './WigGallery';
import PageContainer from '@/src/components/PageContainer';

function ProductImage({
  photos,
  alt,
  favorite,
}: {
  photos: ComponentProps<typeof WigGallery>['photos'];
  alt: string;
  favorite: ComponentProps<typeof WigDetailClient>;
}) {
  return (
    <figure className="relative w-full bg-gray-50">
      <WigDetailClient {...favorite} />
      <WigGallery photos={photos} alt={alt} />
    </figure>
  );
}

function ProductInfo({
  name,
  description,
  wigPrice,
}: {
  name: string;
  description?: string | null;
  wigPrice?: number | string | null;
}) {
  return (
    <section className="px-2 pt-5 pb-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">{name}</h1>

      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1">
          <span className="text-yellow-400">★</span>
          <span className="font-semibold text-gray-900">5.0</span>
        </div>
        <span className="text-gray-500 text-sm">(57 ביקורות)</span>
      </div>

      {description && (
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          <span className="font-semibold">תיאור:</span> {description}
        </p>
      )}

      <p className="text-gray-700 text-sm leading-relaxed">
        <span className="font-semibold">אורך:</span> כ-40–45 ס&quot;מ (נופל מעל
        החזה ומתחת לכתפיים).
      </p>
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
  searchParams,
}: {
  params: Promise<{ wigId: string }>;
  searchParams: Promise<{ favorite?: string }>;
}) {
  const [{ wigId }, { favorite }] = await Promise.all([params, searchParams]);
  const [wig, user] = await Promise.all([getWig(wigId), getOptionalUser()]);

  if (!wig) {
    notFound();
  }

  const initialFavorited = user ? await isFavorite(user.id, wig.id) : false;

  return (
    <PageContainer className="p-4">
      <ProductImage
        photos={wig.photos}
        alt={wig.name}
        favorite={{
          wigId: wig.id,
          initialFavorited,
          isSignedIn: user !== null,
          autoFavorite: favorite === '1',
        }}
      />
      <ProductInfo
        name={wig.name}
        description={wig.description}
        wigPrice={wig.price}
      />
      <div className="h-36"></div>
    
      <WigActionButtons wigId={wig.id} />
    </PageContainer>
  );
}
