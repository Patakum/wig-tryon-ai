import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, twoFactor } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { passkey } from '@better-auth/passkey';
import { headers } from 'next/headers';
import { isFakeProviders } from '@/src/lib/fake-providers';
import { prisma } from '@/src/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: {
    allowedHosts: ['wig-tryon-*.vercel.app', 'localhost:3000', 'localhost:3001'],
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  rateLimit: {
    // The end-to-end suite signs up many accounts within seconds.
    enabled: !isFakeProviders(),
    window: 60,
    max: 100,
  },
  advanced: {
    // WebKit rejects Secure cookies on plain-http localhost, which the
    // end-to-end suite uses; only the fake-provider test mode turns them off.
    ...(isFakeProviders() ? { useSecureCookies: false } : {}),
    database: {
      generateId: 'uuid',
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
      credits: {
        type: 'number',
        defaultValue: 3,
        input: false,
      },
    },
  },
  plugins: [
    admin({ defaultRole: 'user', adminRoles: ['admin'] }),
    twoFactor(),
    passkey(),
    nextCookies(),
  ],
});

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
