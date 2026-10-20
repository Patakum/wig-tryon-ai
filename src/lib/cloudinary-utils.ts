import cloudinary, { assertCloudinaryConfig } from './cloudinary';
import { throwApiError } from '@/src/lib/api/errors';

export type CloudinaryFolder = 'wig-ai' | 'wig-ai/wigs' | 'generations';

export type UploadResult = {
  publicId: string;
  secureUrl: string;
};

export async function fetchCloudinaryImage(
  imageUrl: string,
): Promise<{ body: ReadableStream<Uint8Array>; contentType: string }> {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throwApiError(502, 'IMAGE_UNAVAILABLE', 'Image retrieval failed');
  }

  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
    throwApiError(502, 'IMAGE_UNAVAILABLE', 'Image retrieval failed');
  }

  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store', redirect: 'error' });
  } catch {
    throwApiError(502, 'IMAGE_UNAVAILABLE', 'Image retrieval failed');
  }

  const contentType = response.headers
    .get('content-type')
    ?.split(';', 1)[0]
    .toLowerCase();
  const allowedTypes = new Set([
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  if (!response.ok || !response.body || !contentType || !allowedTypes.has(contentType)) {
    throwApiError(502, 'IMAGE_UNAVAILABLE', 'Image retrieval failed');
  }

  return { body: response.body, contentType };
}

/**
 * Upload a raw buffer to Cloudinary (more efficient than base64 — avoids 33% size overhead).
 */
export async function uploadImageFromBuffer(
  buffer: Buffer,
  folder: CloudinaryFolder,
): Promise<UploadResult> {
  assertCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('Cloudinary upload failed'));
        }
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Upload a wig reference image buffer to the wig-ai/wigs folder.
 */
export function uploadWigFromBuffer(buffer: Buffer): Promise<UploadResult> {
  return uploadImageFromBuffer(buffer, 'wig-ai/wigs');
}

/**
 * Upload a base64 data URI or remote URL to Cloudinary.
 */
export async function uploadImage(
  file: string,
  folder: CloudinaryFolder,
): Promise<UploadResult> {
  assertCloudinaryConfig();
  const result = await cloudinary.uploader.upload(file, { folder });
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}

/**
 * Upload a selfie (user photo) to the wig-ai folder.
 */
export function uploadSelfie(file: string): Promise<UploadResult> {
  return uploadImage(file, 'wig-ai');
}

/**
 * Upload a wig reference image to the wig-ai/wigs folder.
 */
export function uploadWig(file: string): Promise<UploadResult> {
  return uploadImage(file, 'wig-ai/wigs');
}

/**
 * Upload a generation result image to the generations folder.
 */
export function uploadGeneration(file: string): Promise<UploadResult> {
  return uploadImage(file, 'generations');
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Build the Cloudinary secure URL for a given public ID.
 * Optionally pass Cloudinary transformation options.
 */
export function getImageUrl(
  publicId: string,
  options?: Record<string, unknown>,
): string {
  return cloudinary.url(publicId, { secure: true, ...options });
}
