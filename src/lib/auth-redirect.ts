const AUTH_REDIRECT_ORIGIN = 'https://wig-tryon.invalid';

export function getSafeRedirect(
  destination: string | null | undefined,
  fallback = '/catalog',
): string {
  if (
    !destination ||
    !destination.startsWith('/') ||
    destination.startsWith('//') ||
    destination.includes('\\')
  ) {
    return fallback;
  }

  try {
    const url = new URL(destination, AUTH_REDIRECT_ORIGIN);

    if (url.origin !== AUTH_REDIRECT_ORIGIN) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
