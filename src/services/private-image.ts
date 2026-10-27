import { fetchStoredImage } from '@/src/lib/cloudinary-utils';
import { getGenerationForViewer } from '@/src/services/generation';
import { getPhotoForViewer } from '@/src/services/photo';
import type { ViewerIdentity } from '@/src/types/viewer';

export async function getPhotoImage(
  photoId: string,
  viewer: ViewerIdentity,
) {
  const photo = await getPhotoForViewer(photoId, viewer);
  return fetchStoredImage({
    imageUrl: photo.imageUrl,
    publicId: photo.imagePublicId,
  });
}

export async function getGenerationImage(
  generationId: string,
  viewer: ViewerIdentity,
) {
  const generation = await getGenerationForViewer(generationId, viewer);

  if (!generation.resultImageUrl && !generation.resultPublicId) {
    return null;
  }

  return fetchStoredImage({
    imageUrl: generation.resultImageUrl,
    publicId: generation.resultPublicId,
  });
}
