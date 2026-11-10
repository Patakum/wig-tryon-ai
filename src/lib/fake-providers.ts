// Test-only stand-ins for Cloudinary and OpenAI, used by the end-to-end suite
// so no test ever makes a billable call. Enabled with E2E_FAKE_PROVIDERS=1.
//
// Safety: fake mode refuses to run next to real provider credentials, so a
// production deployment (which always has them) can never use it.

export function isFakeProviders(): boolean {
  if (process.env.E2E_FAKE_PROVIDERS !== '1') {
    return false;
  }

  if (process.env.OPENAI_API_KEY || process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      'E2E_FAKE_PROVIDERS is set while real provider credentials are configured. Refusing to run.',
    );
  }

  return true;
}

type FakeImage = { buffer: Buffer; contentType: string };

// Kept on globalThis so every route handler in the process shares one store.
const globalStore = globalThis as { __fakeImages?: Map<string, FakeImage> };
const store: Map<string, FakeImage> = (globalStore.__fakeImages ??= new Map());

let counter = 0;

export function putFakeImage(
  buffer: Buffer,
  folder: string,
  contentType = 'image/jpeg',
) {
  counter += 1;
  const publicId = `${folder}/fake-${Date.now()}-${counter}`;
  store.set(publicId, { buffer, contentType });

  return {
    publicId,
    secureUrl: `https://res.cloudinary.com/e2e-fake/image/authenticated/v1/${publicId}.jpg`,
  };
}

export function getFakeImage(publicId: string): FakeImage | undefined {
  return store.get(publicId);
}

export function deleteFakeImage(publicId: string): void {
  store.delete(publicId);
}
