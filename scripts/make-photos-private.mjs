// Moves existing PUBLIC customer images (selfies and try-on results) in
// Cloudinary to the private "authenticated" delivery type and records their
// public IDs in the database.
//
// Dry run by default. Re-running is safe: rows that already have a public ID
// are skipped.
//
//   node --env-file=.env scripts/make-photos-private.mjs --limit 1          (dry run)
//   node --env-file=.env scripts/make-photos-private.mjs --apply --limit 1  (move one)
//   node --env-file=.env scripts/make-photos-private.mjs --apply            (move all)
//
// Needs DATABASE_URL and the CLOUDINARY_* variables. Try one image first
// (--limit 1) and open an old image URL afterwards: it should stop working.

import pg from 'pg';
import { v2 as cloudinary } from 'cloudinary';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const limitIndex = args.indexOf('--limit');
const limit =
  limitIndex !== -1 ? Number.parseInt(args[limitIndex + 1], 10) : undefined;

if (limitIndex !== -1 && !(limit > 0)) {
  console.error('--limit needs a positive number');
  process.exit(1);
}

for (const name of [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]) {
  if (!process.env[name]) {
    console.error(`${name} is not set`);
    process.exit(1);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getPublicIdFromUrl(imageUrl) {
  let url;
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

  // Only public "upload" assets need moving.
  if (uploadIndex === -1) {
    return null;
  }

  const rest = segments.slice(uploadIndex + 1);
  const versionIndex = rest.findIndex((segment) => /^v\d+$/.test(segment));
  const idSegments = versionIndex === -1 ? rest : rest.slice(versionIndex + 1);

  if (idSegments.length === 0) {
    return null;
  }

  return idSegments
    .map(decodeURIComponent)
    .join('/')
    .replace(/\.[A-Za-z0-9]+$/, '');
}

async function isStillPublic(imageUrl) {
  try {
    const res = await fetch(imageUrl, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function moveToPrivate(publicId) {
  try {
    const result = await cloudinary.uploader.rename(publicId, publicId, {
      type: 'upload',
      to_type: 'authenticated',
      invalidate: true,
    });

    return result.secure_url;
  } catch (error) {
    // A previous run may have moved it already: accept that case.
    try {
      const existing = await cloudinary.api.resource(publicId, {
        type: 'authenticated',
      });

      return existing.secure_url;
    } catch {
      throw error;
    }
  }
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const targets = [
  {
    label: 'selfie',
    table: 'Photo',
    urlColumn: 'imageUrl',
    idColumn: 'imagePublicId',
    where: `"imagePublicId" IS NULL AND "imageUrl" <> '' AND "deletedAt" IS NULL`,
  },
  {
    label: 'result',
    table: 'Generation',
    urlColumn: 'resultImageUrl',
    idColumn: 'resultPublicId',
    where: `"resultPublicId" IS NULL AND "resultImageUrl" IS NOT NULL AND "deletedAt" IS NULL`,
  },
];

const summary = { moved: 0, wouldMove: 0, skipped: 0, failed: 0 };
let remaining = limit ?? Infinity;

console.log(apply ? 'APPLY mode' : 'DRY RUN (use --apply to make changes)');

for (const target of targets) {
  if (remaining <= 0) break;

  const { rows } = await client.query(
    `SELECT id, "${target.urlColumn}" AS url FROM "${target.table}" WHERE ${target.where} ORDER BY "createdAt" LIMIT $1`,
    [Number.isFinite(remaining) ? remaining : 1_000_000],
  );

  console.log(`${target.label}s to process: ${rows.length}`);

  for (const row of rows) {
    const publicId = getPublicIdFromUrl(row.url);

    if (!publicId) {
      console.log(`  skip ${target.table} ${row.id}: not a public Cloudinary upload URL`);
      summary.skipped += 1;
      continue;
    }

    remaining -= 1;

    if (!apply) {
      console.log(`  would move ${target.label} ${row.id} (${publicId})`);
      summary.wouldMove += 1;
      continue;
    }

    try {
      const privateUrl = await moveToPrivate(publicId);

      await client.query(
        `UPDATE "${target.table}" SET "${target.urlColumn}" = $1, "${target.idColumn}" = $2 WHERE id = $3`,
        [privateUrl, publicId, row.id],
      );

      const leaked = await isStillPublic(row.url);
      console.log(
        `  moved ${target.label} ${row.id} (${publicId})${leaked ? '  WARNING: old public URL still responds (CDN cache?)' : ''}`,
      );
      summary.moved += 1;
    } catch (error) {
      console.error(
        `  FAILED ${target.label} ${row.id} (${publicId}): ${error?.message ?? error}`,
      );
      summary.failed += 1;
    }
  }
}

await client.end();

console.log(JSON.stringify(summary));
process.exit(summary.failed > 0 ? 1 : 0);
