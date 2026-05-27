import Replicate from 'replicate';
import { throwApiError } from '@/src/lib/api/errors';

/**
 * Hair segmentation model on Replicate.
 *
 * Set REPLICATE_HAIR_SEGMENTATION_MODEL in your environment to the full
 * model identifier in the format  owner/model:64-char-version-hash
 *
 * Example models to consider (verify current version hash on replicate.com):
 *   - nateraw/hair-segmentation:<version>
 *   - any SAM-based segmentation model with "hair" as the text prompt
 *
 * The model must accept an `image` input (URL) and return either:
 *   - a string URL, or
 *   - an array where index 0 is the mask URL
 * pointing to a grayscale PNG where white = hair, black = background.
 */
const HAIR_SEGMENTATION_MODEL = process.env
  .REPLICATE_HAIR_SEGMENTATION_MODEL as
  | `${string}/${string}:${string}`
  | undefined;

function getReplicateClient(): Replicate {
  const auth = process.env.REPLICATE_API_TOKEN;

  if (!auth) {
    throwApiError(
      500,
      'REPLICATE_MISCONFIGURED',
      'REPLICATE_API_TOKEN not configured. Set it in your environment.',
    );
  }

  return new Replicate({ auth });
}

/**
 * Runs a hair segmentation model on the given image URL and returns the
 * URL of the resulting grayscale mask image (white = hair region).
 */
export async function segmentHair(imageUrl: string): Promise<string> {
  if (!HAIR_SEGMENTATION_MODEL) {
    throwApiError(
      500,
      'REPLICATE_MISCONFIGURED',
      'REPLICATE_HAIR_SEGMENTATION_MODEL is not set. ' +
        'Provide a model identifier in owner/model:version format.',
    );
  }

  const replicate = getReplicateClient();

  const output = await replicate.run(HAIR_SEGMENTATION_MODEL, {
    input: { image: imageUrl },
  });

  // Models return either a URL string directly or an array of URLs
  const maskUrl = Array.isArray(output) ? output[0] : output;

  if (typeof maskUrl !== 'string' || !maskUrl.startsWith('http')) {
    throw new Error(
      `Unexpected Replicate output format for hair segmentation: ${JSON.stringify(maskUrl)}`,
    );
  }

  return maskUrl;
}
