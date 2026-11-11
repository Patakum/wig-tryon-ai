import { describe, expect, it } from 'vitest';
import { requireUploadConsent, uploadBase64Schema } from '@/src/lib/api/parse';

function form(consent?: string) {
  const data = new FormData();
  if (consent !== undefined) data.append('consent', consent);
  return data;
}

describe('upload consent', () => {
  it('accepts a multipart upload only with consent=true', () => {
    expect(() => requireUploadConsent(form('true'))).not.toThrow();
    expect(() => requireUploadConsent(form())).toThrowError(/consent/i);
    expect(() => requireUploadConsent(form('false'))).toThrowError(/consent/i);
    expect(() => requireUploadConsent(form('yes'))).toThrowError(/consent/i);
  });

  it('requires consent: true for base64 uploads', () => {
    const file = 'data:image/png;base64,AAAA';

    expect(uploadBase64Schema.safeParse({ file, consent: true }).success).toBe(true);
    expect(uploadBase64Schema.safeParse({ file }).success).toBe(false);
    expect(uploadBase64Schema.safeParse({ file, consent: false }).success).toBe(false);
  });
});
