import jpeg from 'jpeg-js';
import {
  createSoilColorAssistUpdatesFromPhotoBase64,
  extractMunsellCandidateOptions,
  getNearestMunsellCandidates,
} from './soil-color-photo-assist';

describe('soil color photo assist', () => {
  it('estimates Munsell candidates from a JPEG color sample', () => {
    const updates = createSoilColorAssistUpdatesFromPhotoBase64(
      createSolidJpegBase64({ red: 111, green: 87, blue: 61 })
    );

    expect(updates.soilColorAssistStatus).toBe('candidatesAvailable');
    expect(updates.soilColorAssistCandidates).toContain('1: 10YR 4/3');
    expect(updates.soilColorAssistCandidates).toContain('사진 중앙부 평균 RGB');
  });

  it('returns nearest candidates for direct RGB samples', () => {
    const candidates = getNearestMunsellCandidates({
      red: 139,
      green: 128,
      blue: 88,
    });

    expect(candidates[0].munsell).toBe('2.5Y 5/3');
    expect(candidates[0].confidence).toBe('high');
  });

  it('extracts unique Munsell options from candidate text', () => {
    expect(extractMunsellCandidateOptions(
      '1: 10YR 4/3 (보통)\n2: 10YR 4/3\n3: GLEY 1 4/N'
    )).toEqual(['10YR 4/3', 'GLEY 1 4/N']);
  });

  it('uses Korean field wording when photo color sampling fails', () => {
    const updates = createSoilColorAssistUpdatesFromPhotoBase64('not-a-jpeg');

    expect(updates.soilColorAssistStatus).toBe('lowConfidence');
    expect(updates.soilColorAssistCandidates).toContain('먼셀값');
    expect(updates.soilColorAssistCandidates).not.toContain('Munsell 값');
  });
});

const createSolidJpegBase64 = (rgb: {
  blue: number;
  green: number;
  red: number;
}): string => {
  const width = 12;
  const height = 12;
  const data = new Uint8Array(width * height * 4);

  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset] = rgb.red;
    data[offset + 1] = rgb.green;
    data[offset + 2] = rgb.blue;
    data[offset + 3] = 255;
  }

  return Buffer.from(jpeg.encode({ data, width, height }, 90).data)
    .toString('base64');
};
