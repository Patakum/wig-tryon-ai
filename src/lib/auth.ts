import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, twoFactor } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { passkey } from '@better-auth/passkey';
import { headers } from 'next/headers';
import { prisma } from '@/src/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced:{
    database: {
      generateId:"uuid"
    }
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
  plugins: [admin(), twoFactor(), passkey(), nextCookies()],
});

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
