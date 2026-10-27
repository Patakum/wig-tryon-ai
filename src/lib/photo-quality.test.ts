import { describe, expect, it } from 'vitest';
import {
  evaluatePhotoQuality,
  type PhotoMeasurements,
} from '@/src/lib/photo-quality';

const good: PhotoMeasurements = {
  width: 1000,
  height: 1200,
  meanLuminance: 130,
  face: { count: 1, box: { x: 350, y: 300, width: 300, height: 360 } },
};

const codes = (m: PhotoMeasurements) =>
  evaluatePhotoQuality(m).map((issue) => `${issue.severity}:${issue.code}`);

describe('evaluatePhotoQuality', () => {
  it('reports nothing for a good, centered photo', () => {
    expect(codes(good)).toEqual([]);
  });

  it('blocks small images and extreme brightness', () => {
    expect(codes({ ...good, width: 500, face: undefined })).toEqual([
      'block:too_small',
    ]);
    expect(codes({ ...good, meanLuminance: 10 })).toEqual(['block:too_dark']);
    expect(codes({ ...good, meanLuminance: 250 })).toEqual(['block:too_bright']);
  });

  it('only warns on borderline brightness', () => {
    expect(codes({ ...good, meanLuminance: 55 })).toEqual(['warn:dark']);
    expect(codes({ ...good, meanLuminance: 215 })).toEqual(['warn:bright']);
  });

  it('blocks a missing face and several faces', () => {
    expect(codes({ ...good, face: { count: 0 } })).toEqual(['block:no_face']);
    expect(codes({ ...good, face: { count: 3 } })).toEqual([
      'block:multiple_faces',
    ]);
  });

  it('skips face rules when detection was unavailable (fail open)', () => {
    expect(codes({ ...good, face: undefined })).toEqual([]);
  });

  it('warns about framing: small, large and off-center faces', () => {
    const at = (x: number, width: number): PhotoMeasurements => ({
      ...good,
      face: { count: 1, box: { x, y: 300, width, height: width } },
    });

    expect(codes(at(450, 100))).toEqual(['warn:face_small']);
    expect(codes(at(100, 850))).toEqual(['warn:face_large']);
    expect(codes(at(650, 300))).toEqual(['warn:face_off_center']);
  });
});
