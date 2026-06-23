import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  KoreanFieldworkFieldNoteInput,
  KoreanFieldworkFieldNoteMode,
  normalizeFieldNoteText,
} from './korean-fieldwork-field-notes';
import {
  hasKoreanFieldworkHandwriting,
  KoreanFieldworkHandwritingStroke,
  normalizeKoreanFieldworkHandwritingStrokes,
} from './korean-fieldwork-handwriting';

export interface KoreanFieldworkFieldNoteDraft {
  input: KoreanFieldworkFieldNoteInput;
  mode: KoreanFieldworkFieldNoteMode;
  updatedAt: string;
  handwritingStrokes?: KoreanFieldworkHandwritingStroke[];
}

const STORAGE_KEY_PREFIX = 'koreanFieldwork.fieldNoteDraft.v1';
const FIELD_NAMES: (keyof KoreanFieldworkFieldNoteInput)[] = [
  'observation',
  'interpretation',
  'nextWork',
  'evidenceNumbers',
];
const MODES = new Set<KoreanFieldworkFieldNoteMode>([
  'recordMemo',
  'dailyLog',
  'both',
]);

export const createKoreanFieldworkFieldNoteDraftKey = (
  scopeId: string,
  documentId: string
): string => [
  STORAGE_KEY_PREFIX,
  encodeURIComponent(scopeId || 'default'),
  encodeURIComponent(documentId),
].join(':');

export const loadKoreanFieldworkFieldNoteDraft = async (
  storageKey: string
): Promise<KoreanFieldworkFieldNoteDraft | undefined> => {
  const storedDraft = await AsyncStorage.getItem(storageKey);
  if (!storedDraft) return undefined;

  try {
    return normalizeDraft(JSON.parse(storedDraft));
  } catch {
    return undefined;
  }
};

export const saveKoreanFieldworkFieldNoteDraft = async (
  storageKey: string,
  draft: KoreanFieldworkFieldNoteDraft
) => {
  const normalizedDraft = normalizeDraft(draft);

  if (!hasKoreanFieldworkFieldNoteDraftText(
    normalizedDraft.input,
    normalizedDraft.handwritingStrokes
  )) {
    await removeKoreanFieldworkFieldNoteDraft(storageKey);
    return;
  }

  await AsyncStorage.setItem(storageKey, JSON.stringify(normalizedDraft));
};

export const removeKoreanFieldworkFieldNoteDraft = async (
  storageKey: string
) => {
  await AsyncStorage.removeItem(storageKey);
};

export const hasKoreanFieldworkFieldNoteDraftText = (
  input: KoreanFieldworkFieldNoteInput,
  handwritingStrokes: readonly KoreanFieldworkHandwritingStroke[] = []
): boolean => FIELD_NAMES.some((fieldName) =>
  normalizeFieldNoteText(input[fieldName] ?? '').length > 0
) || hasKoreanFieldworkHandwriting(handwritingStrokes);

const normalizeDraft = (draft: unknown): KoreanFieldworkFieldNoteDraft => {
  const value = isRecord(draft) ? draft : {};
  const mode = isFieldNoteMode(value.mode)
    ? value.mode
    : 'recordMemo';
  const input = isRecord(value.input) ? value.input : {};
  const updatedAt = typeof value.updatedAt === 'string'
    ? value.updatedAt
    : new Date(0).toISOString();
  const handwritingStrokes = normalizeKoreanFieldworkHandwritingStrokes(
    value.handwritingStrokes
  );

  return {
    input: FIELD_NAMES.reduce((result, fieldName) => ({
      ...result,
      [fieldName]: typeof input[fieldName] === 'string'
        ? normalizeFieldNoteText(input[fieldName] as string)
        : '',
    }), {} as KoreanFieldworkFieldNoteInput),
    mode,
    updatedAt,
    handwritingStrokes,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

const isFieldNoteMode = (
  value: unknown
): value is KoreanFieldworkFieldNoteMode =>
  typeof value === 'string' && MODES.has(value as KoreanFieldworkFieldNoteMode);
