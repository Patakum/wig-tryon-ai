// Shared TypeScript types
interface Wig {
  id: string;
  name: string;
  imageUrl: string;
  price?: number | null;
  description?: string | null;
}

interface UploadedPhoto {
  photoId: string;
  imageUrl: string;
}

export type { Wig, UploadedPhoto };