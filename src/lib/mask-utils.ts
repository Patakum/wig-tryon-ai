import sharp from 'sharp';

/**
 * Fetches a grayscale hair segmentation mask from the given URL and converts
 * it to a PNG buffer that OpenAI's images.edit endpoint accepts as a mask.
 *
 * OpenAI mask convention:
 *   - Transparent pixels (alpha = 0)  → OpenAI edits these areas (hair region)
 *   - Opaque pixels    (alpha = 255) → OpenAI preserves these areas (face / body)
 *
 * Segmentation mask convention (input from Replicate):
 *   - White (255) = hair
 *   - Black (0)   = non-hair
 *
 * Conversion: alpha = 255 - grayscale  (inverts so hair becomes transparent)
 */
export async function buildHairMask(
  maskUrl: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const response = await fetch(maskUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch segmentation mask (${response.status}): ${maskUrl}`,
    );
  }

  const inputBuffer = Buffer.from(await response.arrayBuffer());

  // Resize and extract raw grayscale pixel values
  const { data: grayData } = await sharp(inputBuffer)
    .resize(width, height, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Build RGBA buffer: R=G=B=0, alpha = inverted grayscale
  const rgbaData = Buffer.alloc(width * height * 4, 0);
  for (let i = 0; i < grayData.length; i++) {
    rgbaData[i * 4 + 3] = 255 - grayData[i]; // alpha: hair → 0, non-hair → 255
  }

  return sharp(rgbaData, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Generates a geometric hair mask based on portrait-photo proportions.
 * Used as a fallback when AI segmentation is unavailable.
 *
 * The mask targets the upper ~35–45% of the image (where hair sits in a
 * standard selfie) with a smooth gradient fade to avoid hard edges.
 *
 * OpenAI mask convention:
 *   - Transparent (alpha = 0)   → edit this area (hair)
 *   - Opaque     (alpha = 255)  → preserve this area (face / body)
 */
export async function buildGeometricHairMask(
  width: number,
  height: number,
): Promise<Buffer> {
  // Hair region occupies roughly the top 35% of a portrait selfie.
  // A gradient fade runs from 35% → 45% to avoid a sharp cutline.
  const hairLineY = height * 0.35; // fully transparent below this
  const fadeEndY = height * 0.45; // fully opaque above this

  const rgbaData = Buffer.alloc(width * height * 4, 0);

  for (let y = 0; y < height; y++) {
    let alpha: number;

    if (y <= hairLineY) {
      alpha = 0; // hair zone → transparent → OpenAI edits here
    } else if (y >= fadeEndY) {
      alpha = 255; // face/body zone → opaque → OpenAI preserves
    } else {
      // Smooth linear fade between the two zones
      alpha = Math.round(((y - hairLineY) / (fadeEndY - hairLineY)) * 255);
    }

    for (let x = 0; x < width; x++) {
      rgbaData[(y * width + x) * 4 + 3] = alpha;
    }
  }

  return sharp(rgbaData, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}
