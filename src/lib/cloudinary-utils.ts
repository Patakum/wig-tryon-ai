import cloudinary, { assertCloudinaryConfig } from './cloudinary';
import { throwApiError } from '@/src/lib/api/errors';
import {
  deleteFakeImage,
  getFakeImage,
  isFakeProviders,
  putFakeImage,
} from '@/src/lib/fake-providers';

export type CloudinaryFolder = 'wig-ai' | 'wig-ai/wigs' | 'generations';

export type UploadResult = {
  publicId: string;
  secureUrl: string;
};

// A stored customer image. Private images carry a publicId and are only
// reachable through a signed URL built on demand; legacy rows have just the
// old public URL.
export type StoredImageRef = {
  imageUrl: string | null;
  publicId: string | null;
};

export type CloudinaryDeliveryType = 'upload' | 'authenticated';

/**
 * Build a signed URL for a private (authenticated) image. Signatures do not
 * expire, so this URL must stay on the server and never reach a client.
 */
export function getSignedPrivateUrl(publicId: string): string {
  assertCloudinaryConfig();

  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    resource_type: 'image',
  });
}

function resolveFetchUrl(ref: StoredImageRef): string {
  if (ref.publicId) {
    return getSignedPrivateUrl(ref.publicId);
  }

  if (ref.imageUrl) {
    return ref.imageUrl;
  }

  throwApiError(502, 'IMAGE_UNAVAILABLE', 'Image retrieval failed');
}

export async function fetchStoredImage(ref: StoredImageRef) {
  if (isFakeProviders() && ref.publicId) {
    const fake = getFakeImage(ref.publicId);

    if (!fake) {
      throwApiError(502, 'IMAGE_UNAVAILABLE', 'Image retrieval failed');
    }

    return {
      body: new Response(new Uint8Array(fake.buffer)).body as ReadableStream<Uint8Array>,
      contentType: fake.contentType,
    };
  }

  return fetchCloudinaryImage(resolveFetchUrl(ref));
}

export async function fetchStoredImageBuffer(
  ref: StoredImageRef,
): Promise<Buffer> {
  const { body } = await fetchStoredImage(ref);

  return Buffer.from(await new Response(body).arrayBuffer());
}

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
 * Upload a customer image buffer as a private (authenticated) asset.
 */
export async function uploadPrivateImageFromBuffer(
  buffer: Buffer,
  folder: CloudinaryFolder,
): Promise<UploadResult> {
  if (isFakeProviders()) {
    return putFakeImage(buffer, folder);
  }

  assertCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        type: 'authenticated',
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      },
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
 * Upload a customer selfie as a private asset.
 */
export function uploadPrivateSelfie(buffer: Buffer): Promise<UploadResult> {
  return uploadPrivateImageFromBuffer(buffer, 'wig-ai');
}

/**
 * Upload a generation result (base64 data URI) as a private asset.
 */
export async function uploadGeneration(file: string): Promise<UploadResult> {
  if (isFakeProviders()) {
    const base64 = file.slice(file.indexOf(',') + 1);

    return putFakeImage(Buffer.from(base64, 'base64'), 'generations');
  }

  assertCloudinaryConfig();
  const result = await cloudinary.uploader.upload(file, {
    folder: 'generations',
    type: 'authenticated',
  });

  return { publicId: result.public_id, secureUrl: result.secure_url };
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteImage(
  publicId: string,
  type: CloudinaryDeliveryType = 'upload',
): Promise<void> {
  if (isFakeProviders()) {
    deleteFakeImage(publicId);
    return;
  }

  assertCloudinaryConfig();
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    type,
  });

  // A missing asset is already deleted, which keeps retries safe.
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error('Cloudinary deletion failed');
  }
}

/**
 * Extract the public ID from a Cloudinary delivery URL, or null if the URL
 * is not one of ours.
 */
export function getPublicIdFromUrl(imageUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const uploadIndex = segments.indexOf('upload');

  if (uploadIndex === -1) {
    return null;
  }

  const rest = segments.slice(uploadIndex + 1);
  const versionIndex = rest.findIndex((segment) => /^v\d+$/.test(segment));
  const idSegments = versionIndex === -1 ? rest : rest.slice(versionIndex + 1);

  if (idSegments.length === 0) {
    return null;
  }

  const decoded = idSegments.map(decodeURIComponent).join('/');
  return decoded.replace(/\.[A-Za-z0-9]+$/, '');
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
