import { fetchCloudinaryImage } from '@/src/lib/cloudinary-utils';
import { getGenerationForViewer } from '@/src/services/generation';
import { getPhotoForViewer } from '@/src/services/photo';
import type { ViewerIdentity } from '@/src/types/viewer';

export async function getPhotoImage(
  photoId: string,
  viewer: ViewerIdentity,
) {
  const photo = await getPhotoForViewer(photoId, viewer);
  return fetchCloudinaryImage(photo.imageUrl);
}

export async function getGenerationImage(
  generationId: string,
  viewer: ViewerIdentity,
) {
  const generation = await getGenerationForViewer(generationId, viewer);

  if (!generation.resultImageUrl) {
    return null;
  }

  return fetchCloudinaryImage(generation.resultImageUrl);
}
