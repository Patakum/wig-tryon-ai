import { isFakeProviders } from '@/src/lib/fake-providers';

// Fail fast at boot if test-only fake providers are enabled next to real
// provider credentials (the check throws).
export function register() {
  isFakeProviders();
}
