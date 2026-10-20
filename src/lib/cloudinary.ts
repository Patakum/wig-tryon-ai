import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export class CloudinaryConfigError extends Error {
  constructor() {
    super('Server misconfiguration: Cloudinary credentials not set');
    this.name = 'CloudinaryConfigError';
  }
}

export function assertCloudinaryConfig(): void {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new CloudinaryConfigError();
  }
}

export default cloudinary;
