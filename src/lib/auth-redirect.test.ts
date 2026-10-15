import { describe, expect, it } from 'vitest';
import { getSafeRedirect } from '@/src/lib/auth-redirect';

describe('getSafeRedirect', () => {
  it('preserves a local path and its query string', () => {
    expect(getSafeRedirect('/result?id=generation-1')).toBe(
      '/result?id=generation-1',
    );
  });

  it('rejects external and protocol-relative destinations', () => {
    expect(getSafeRedirect('https://attacker.example')).toBe('/catalog');
    expect(getSafeRedirect('//attacker.example')).toBe('/catalog');
  });

  it('rejects backslash-based destinations', () => {
    expect(getSafeRedirect('/\\attacker.example')).toBe('/catalog');
  });

  it('uses the supplied fallback when the destination is missing', () => {
    expect(getSafeRedirect(null, '/upload?wigId=wig-1')).toBe(
      '/upload?wigId=wig-1',
    );
  });
});
