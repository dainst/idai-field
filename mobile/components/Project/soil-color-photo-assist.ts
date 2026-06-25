import jpeg, { RawImageData } from 'jpeg-js';

export interface RgbSample {
  blue: number;
  green: number;
  red: number;
}

export interface SoilColorCandidate {
  confidence: SoilColorConfidence;
  deltaE: number;
  munsell: string;
  rgb: RgbSample;
}

export type SoilColorConfidence = 'high' | 'medium' | 'low';
export type SoilColorAssistStatus =
  | 'candidatesAvailable'
  | 'lowConfidence'
  | 'notRun';

interface MunsellReference {
  munsell: string;
  rgb: RgbSample;
}

interface LabColor {
  a: number;
  b: number;
  l: number;
}

export interface SoilColorPhotoAssistResult {
  averageRgb?: RgbSample;
  candidates: SoilColorCandidate[];
  formattedCandidates: string;
  status: SoilColorAssistStatus;
}

export interface SoilColorAssistResourceUpdates {
  soilColorAssistCandidates?: string;
  soilColorAssistStatus?: SoilColorAssistStatus;
}

const MAX_SAMPLE_COUNT = 6000;
const MAX_DECODE_MEMORY_MB = 96;
const LOW_CONFIDENCE_DELTA_E = 22;
const CANDIDATE_COUNT = 3;

const MUNSELL_REFERENCES: readonly MunsellReference[] = [
  { munsell: '10YR 2/1', rgb: { red: 43, green: 39, blue: 35 } },
  { munsell: '10YR 3/1', rgb: { red: 64, green: 59, blue: 52 } },
  { munsell: '10YR 3/2', rgb: { red: 79, green: 65, blue: 50 } },
  { munsell: '10YR 4/2', rgb: { red: 101, green: 88, blue: 70 } },
  { munsell: '10YR 4/3', rgb: { red: 111, green: 87, blue: 61 } },
  { munsell: '10YR 5/3', rgb: { red: 137, green: 116, blue: 88 } },
  { munsell: '10YR 5/4', rgb: { red: 148, green: 113, blue: 74 } },
  { munsell: '10YR 6/3', rgb: { red: 166, green: 147, blue: 113 } },
  { munsell: '10YR 6/4', rgb: { red: 178, green: 147, blue: 99 } },
  { munsell: '7.5YR 3/2', rgb: { red: 78, green: 55, blue: 43 } },
  { munsell: '7.5YR 4/3', rgb: { red: 112, green: 80, blue: 58 } },
  { munsell: '7.5YR 4/4', rgb: { red: 126, green: 77, blue: 47 } },
  { munsell: '7.5YR 5/4', rgb: { red: 150, green: 105, blue: 70 } },
  { munsell: '7.5YR 5/6', rgb: { red: 164, green: 94, blue: 51 } },
  { munsell: '5YR 3/2', rgb: { red: 79, green: 49, blue: 43 } },
  { munsell: '5YR 4/3', rgb: { red: 112, green: 70, blue: 58 } },
  { munsell: '5YR 4/4', rgb: { red: 128, green: 65, blue: 51 } },
  { munsell: '5YR 5/4', rgb: { red: 153, green: 96, blue: 72 } },
  { munsell: '2.5Y 4/2', rgb: { red: 101, green: 96, blue: 75 } },
  { munsell: '2.5Y 5/2', rgb: { red: 128, green: 122, blue: 96 } },
  { munsell: '2.5Y 5/3', rgb: { red: 139, green: 128, blue: 88 } },
  { munsell: '2.5Y 6/3', rgb: { red: 166, green: 153, blue: 107 } },
  { munsell: '5Y 4/1', rgb: { red: 88, green: 88, blue: 79 } },
  { munsell: '5Y 5/2', rgb: { red: 124, green: 124, blue: 98 } },
  { munsell: 'GLEY 1 4/N', rgb: { red: 84, green: 88, blue: 86 } },
  { munsell: 'GLEY 1 5/N', rgb: { red: 112, green: 116, blue: 114 } },
];

export const createSoilColorAssistUpdatesFromPhotoBase64 = (
  base64?: string
): SoilColorAssistResourceUpdates => {
  if (!base64) return {};

  const result = getSoilColorPhotoAssistFromJpegBase64(base64);

  return {
    soilColorAssistCandidates: result.formattedCandidates,
    soilColorAssistStatus: result.status,
  };
};

export const getSoilColorPhotoAssistFromJpegBase64 = (
  base64: string
): SoilColorPhotoAssistResult => {
  try {
    const decoded = jpeg.decode(decodeBase64(base64), {
      maxMemoryUsageInMB: MAX_DECODE_MEMORY_MB,
      tolerantDecoding: true,
      useTArray: true,
    });
    const averageRgb = getCentralAverageRgb(decoded);
    const candidates = getNearestMunsellCandidates(averageRgb);
    const status = candidates[0]?.deltaE > LOW_CONFIDENCE_DELTA_E
      ? 'lowConfidence'
      : 'candidatesAvailable';

    return {
      averageRgb,
      candidates,
      formattedCandidates: formatCandidates(averageRgb, candidates),
      status,
    };
  } catch (_err) {
    return {
      candidates: [],
      formattedCandidates: '사진 색상 샘플을 읽지 못했습니다. 먼셀값을 직접 확인하세요.',
      status: 'lowConfidence',
    };
  }
};

export const getNearestMunsellCandidates = (
  rgb: RgbSample
): SoilColorCandidate[] => {
  const sampleLab = rgbToLab(rgb);

  return MUNSELL_REFERENCES
    .map((reference) => ({
      confidence: getConfidence(deltaE(sampleLab, rgbToLab(reference.rgb))),
      deltaE: deltaE(sampleLab, rgbToLab(reference.rgb)),
      munsell: reference.munsell,
      rgb: reference.rgb,
    }))
    .sort((left, right) => left.deltaE - right.deltaE)
    .slice(0, CANDIDATE_COUNT);
};

export const extractMunsellCandidateOptions = (text: string): string[] => {
  const matches = text.toUpperCase().match(
    /\b(?:GLEY\s*[12]\s*\d\/N|(?:10|7\.5|5|2\.5)(?:YR|Y|R)\s+\d(?:\.\d)?\/\d(?:\.\d)?)\b/g
  ) ?? [];

  return Array.from(new Set(
    matches.map((match) => match.replace(/\s+/g, ' ').trim())
  ));
};

const getCentralAverageRgb = (
  image: RawImageData<Uint8Array>
): RgbSample => {
  const xStart = Math.floor(image.width * 0.35);
  const xEnd = Math.ceil(image.width * 0.65);
  const yStart = Math.floor(image.height * 0.35);
  const yEnd = Math.ceil(image.height * 0.65);
  const pixelCount = Math.max(1, (xEnd - xStart) * (yEnd - yStart));
  const step = Math.max(1, Math.floor(Math.sqrt(pixelCount / MAX_SAMPLE_COUNT)));
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = yStart; y < yEnd; y += step) {
    for (let x = xStart; x < xEnd; x += step) {
      const offset = ((y * image.width) + x) * 4;
      red += image.data[offset] ?? 0;
      green += image.data[offset + 1] ?? 0;
      blue += image.data[offset + 2] ?? 0;
      count++;
    }
  }

  return {
    blue: Math.round(blue / count),
    green: Math.round(green / count),
    red: Math.round(red / count),
  };
};

const formatCandidates = (
  averageRgb: RgbSample,
  candidates: SoilColorCandidate[]
): string => [
  `사진 중앙부 평균 RGB ${averageRgb.red}/${averageRgb.green}/${averageRgb.blue}`,
  ...candidates.map((candidate, index) =>
    `${index + 1}: ${candidate.munsell} (${getConfidenceLabel(candidate.confidence)}, 차이 ${candidate.deltaE.toFixed(1)})`
  ),
].join('\n');

const decodeBase64 = (base64: string): Uint8Array => {
  const sanitized = base64
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
    .replace(/\s/g, '');

  if (typeof atob === 'function') {
    const binary = atob(sanitized);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  return decodeBase64Fallback(sanitized);
};

const decodeBase64Fallback = (base64: string): Uint8Array => {
  const lookup = createBase64Lookup();
  const placeholders = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array(((base64.length * 3) / 4) - placeholders);
  let byteIndex = 0;

  for (let i = 0; i < base64.length; i += 4) {
    const first = lookup[base64.charAt(i)] ?? 0;
    const second = lookup[base64.charAt(i + 1)] ?? 0;
    const third = base64.charAt(i + 2) === '=' ? 0 : lookup[base64.charAt(i + 2)] ?? 0;
    const fourth = base64.charAt(i + 3) === '=' ? 0 : lookup[base64.charAt(i + 3)] ?? 0;
    const chunk = (first << 18) | (second << 12) | (third << 6) | fourth;

    if (byteIndex < bytes.length) bytes[byteIndex++] = (chunk >> 16) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = (chunk >> 8) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = chunk & 255;
  }

  return bytes;
};

const createBase64Lookup = (): Record<string, number> => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  return alphabet.split('').reduce<Record<string, number>>((lookup, char, index) => {
    lookup[char] = index;
    return lookup;
  }, {});
};

const rgbToLab = (rgb: RgbSample): LabColor => {
  const red = srgbToLinear(rgb.red / 255);
  const green = srgbToLinear(rgb.green / 255);
  const blue = srgbToLinear(rgb.blue / 255);
  const x = ((red * 0.4124) + (green * 0.3576) + (blue * 0.1805)) / 0.95047;
  const y = (red * 0.2126) + (green * 0.7152) + (blue * 0.0722);
  const z = ((red * 0.0193) + (green * 0.1192) + (blue * 0.9505)) / 1.08883;
  const fx = labPivot(x);
  const fy = labPivot(y);
  const fz = labPivot(z);

  return {
    a: (500 * (fx - fy)),
    b: (200 * (fy - fz)),
    l: (116 * fy) - 16,
  };
};

const srgbToLinear = (value: number): number =>
  value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);

const labPivot = (value: number): number =>
  value > 0.008856
    ? Math.cbrt(value)
    : (7.787 * value) + (16 / 116);

const deltaE = (left: LabColor, right: LabColor): number =>
  Math.sqrt(
    Math.pow(left.l - right.l, 2)
    + Math.pow(left.a - right.a, 2)
    + Math.pow(left.b - right.b, 2)
  );

const getConfidence = (difference: number): SoilColorConfidence => {
  if (difference <= 10) return 'high';
  if (difference <= LOW_CONFIDENCE_DELTA_E) return 'medium';
  return 'low';
};

const getConfidenceLabel = (confidence: SoilColorConfidence): string => {
  if (confidence === 'high') return '높음';
  if (confidence === 'medium') return '보통';
  return '낮음';
};
