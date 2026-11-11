import Replicate from 'replicate';
import { throwApiError } from '@/src/lib/api/errors';

/**
 * Hair segmentation model on Replicate.
 *
 * REPLICATE_HAIR_SEGMENTATION_MODEL: full identifier, owner/model:version-hash.
 * Recommended: schananas/grounded_sam:<version> (text-prompted segmentation).
 *
 * Optional tuning (no code change needed when swapping models):
 *   REPLICATE_HAIR_SEGMENTATION_INPUT        JSON merged into the model input.
 *                                            Default targets grounded_sam.
 *   REPLICATE_HAIR_MASK_OUTPUT_INDEX         Which item of an array output is
 *                                            the white-on-black hair mask.
 *
 * The mask must be a grayscale image where white = hair, black = background.
 */
const DEFAULT_MODEL_INPUT: Record<string, unknown> = {
  mask_prompt: 'hair',
  negative_mask_prompt: 'face, skin, ears, neck',
  adjustment_factor: 0,
};

function getModel(): `${string}/${string}:${string}` {
  const model = process.env.REPLICATE_HAIR_SEGMENTATION_MODEL;

  if (!model) {
    throwApiError(
      500,
      'REPLICATE_MISCONFIGURED',
      'REPLICATE_HAIR_SEGMENTATION_MODEL is not set. ' +
        'Provide a model identifier in owner/model:version format.',
    );
  }

  return model as `${string}/${string}:${string}`;
}

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

function getExtraInput(): Record<string, unknown> {
  const raw = process.env.REPLICATE_HAIR_SEGMENTATION_INPUT;
  if (!raw) return DEFAULT_MODEL_INPUT;

  try {
    return { ...DEFAULT_MODEL_INPUT, ...JSON.parse(raw) };
  } catch {
    throw new Error('REPLICATE_HAIR_SEGMENTATION_INPUT is not valid JSON.');
  }
}

function outputItemToUrl(item: unknown): string | null {
  if (typeof item === 'string') return item;
  // replicate v1 returns FileOutput objects with a url() method
  if (item && typeof (item as { url?: unknown }).url === 'function') {
    return String((item as { url: () => URL | string }).url());
  }
  return null;
}

/**
 * Runs a hair segmentation model on the given image URL and returns the
 * URL of the resulting grayscale mask image (white = hair region).
 */
export async function segmentHair(imageUrl: string): Promise<string> {
  const model = getModel();
  const replicate = getReplicateClient();

  const output = await replicate.run(model, {
    input: { ...getExtraInput(), image: imageUrl },
  });

  const index = Number(process.env.REPLICATE_HAIR_MASK_OUTPUT_INDEX ?? 0);
  const item = Array.isArray(output) ? output[index] : output;
  const maskUrl = outputItemToUrl(item);

  if (!maskUrl || !maskUrl.startsWith('http')) {
    throw new Error(
      'Unexpected Replicate output format for hair segmentation ' +
        `(index ${index}, ${Array.isArray(output) ? `${output.length} items` : typeof output}).`,
    );
  }

  return maskUrl;
}
