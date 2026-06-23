export interface KoreanFieldworkHandwritingPoint {
  x: number;
  y: number;
}

export interface KoreanFieldworkHandwritingStroke {
  points: KoreanFieldworkHandwritingPoint[];
}

export interface KoreanFieldworkHandwritingPayload {
  version: 1;
  strokes: KoreanFieldworkHandwritingStroke[];
}

const MAX_COORDINATE = 10000;

export const normalizeKoreanFieldworkHandwritingStrokes = (
  value: unknown
): KoreanFieldworkHandwritingStroke[] => {
  const strokesValue = isRecord(value)
    && Array.isArray(value.strokes)
    ? value.strokes
    : value;

  if (!Array.isArray(strokesValue)) return [];

  return strokesValue
    .map(normalizeStroke)
    .filter((stroke): stroke is KoreanFieldworkHandwritingStroke => !!stroke);
};

export const hasKoreanFieldworkHandwriting = (
  strokes: readonly KoreanFieldworkHandwritingStroke[]
): boolean => strokes.some((stroke) => stroke.points.length > 0);

export const countKoreanFieldworkHandwritingPoints = (
  strokes: readonly KoreanFieldworkHandwritingStroke[]
): number => strokes.reduce((count, stroke) => count + stroke.points.length, 0);

export const serializeKoreanFieldworkHandwriting = (
  strokes: readonly KoreanFieldworkHandwritingStroke[]
): string => JSON.stringify({
  version: 1,
  strokes: normalizeKoreanFieldworkHandwritingStrokes(strokes),
} satisfies KoreanFieldworkHandwritingPayload);

export const buildKoreanFieldworkHandwritingNoteText = (
  strokes: readonly KoreanFieldworkHandwritingStroke[]
): string => {
  const normalizedStrokes = normalizeKoreanFieldworkHandwritingStrokes(strokes);
  if (!hasKoreanFieldworkHandwriting(normalizedStrokes)) return '';

  const pointCount = countKoreanFieldworkHandwritingPoints(normalizedStrokes);

  return [
    `[손그림 메모] 획 ${normalizedStrokes.length}개, 점 ${pointCount}개`,
    `[손그림 좌표] ${serializeKoreanFieldworkHandwriting(normalizedStrokes)}`,
  ].join('\n');
};

export const extractKoreanFieldworkHandwritingFromText = (
  text: string
): KoreanFieldworkHandwritingStroke[] => {
  const match = text.match(/^\[손그림 좌표\]\s*(.+)$/m);
  if (!match) return [];

  try {
    return normalizeKoreanFieldworkHandwritingStrokes(JSON.parse(match[1]));
  } catch {
    return [];
  }
};

const normalizeStroke = (
  value: unknown
): KoreanFieldworkHandwritingStroke | undefined => {
  if (!isRecord(value) || !Array.isArray(value.points)) return undefined;

  const points = value.points
    .map(normalizePoint)
    .filter((point): point is KoreanFieldworkHandwritingPoint => !!point);

  return points.length > 0 ? { points } : undefined;
};

const normalizePoint = (
  value: unknown
): KoreanFieldworkHandwritingPoint | undefined => {
  if (!isRecord(value)) return undefined;

  const x = normalizeCoordinate(value.x);
  const y = normalizeCoordinate(value.y);

  return x === undefined || y === undefined ? undefined : { x, y };
};

const normalizeCoordinate = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;

  return Math.max(0, Math.min(MAX_COORDINATE, Math.round(value)));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';
