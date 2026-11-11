import { Pool } from 'pg';
import { E2E_DATABASE_URL } from '../../playwright.config';

const pool = new Pool({ connectionString: E2E_DATABASE_URL });

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(sql, params);

  return result.rows as T[];
}

export async function closeDb() {
  await pool.end();
}

const TABLES = [
  'Feedback',
  'Generation',
  'Photo',
  'Favorite',
  'WigPhoto',
  'Wig',
  'GuestSession',
  'Session',
  'Account',
  'Verification',
  'TwoFactor',
  'Passkey',
  'User',
];

// A tiny inline image keeps wig pictures self-contained (no network needed).
const WIG_IMAGE = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#b5835a"/></svg>',
).toString('base64')}`;

export const WIGS = {
  classic: { id: 'wig-classic', name: 'פאה קלאסית' },
  second: { id: 'wig-second', name: 'פאה שנייה' },
  failing: { id: 'wig-fail', name: '[fail] פאה תקולה' },
  noCredits: { id: 'wig-quota', name: '[quota] פאה ללא קרדיטים' },
};

export async function resetDatabase() {
  await query(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`);

  for (const wig of Object.values(WIGS)) {
    await query(
      `INSERT INTO "Wig"(id, name, description, "imageUrl", price) VALUES ($1, $2, 'תיאור לבדיקה', $3, 500)`,
      [wig.id, wig.name, WIG_IMAGE],
    );
    // The classic wig gets a second photo so the swipe gallery is exercised.
    const photos = wig.id === WIGS.classic.id ? 2 : 1;
    for (let position = 0; position < photos; position++) {
      await query(
        `INSERT INTO "WigPhoto"(id, "wigId", "imageUrl", position) VALUES (gen_random_uuid()::text, $1, $2, $3)`,
        [wig.id, WIG_IMAGE, position],
      );
    }
  }
}

export async function makeAdmin(email: string) {
  await query(`UPDATE "User" SET role = 'admin' WHERE email = $1`, [email]);
}
