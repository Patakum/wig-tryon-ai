// Shared TypeScript types
interface Wig {
  id: string;
  name: string;
  imageUrl: string;
}

interface UploadedPhoto {
  photoId: string;
  imageUrl: string;
}

export type { Wig, UploadedPhoto };