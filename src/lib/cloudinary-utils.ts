import cloudinary, { assertCloudinaryConfig } from './cloudinary';

export type CloudinaryFolder = 'wig-ai' | 'wig-ai/wigs' | 'generations';

export type UploadResult = {
  publicId: string;
  secureUrl: string;
};

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
