import { router } from 'expo-router';

export const KOREAN_FIELDWORK_RETURN_TARGETS = {
  FIELD_BOARD: 'fieldBoard',
  MAP: 'map',
} as const;

export type KoreanFieldworkReturnTarget =
  typeof KOREAN_FIELDWORK_RETURN_TARGETS[keyof typeof KOREAN_FIELDWORK_RETURN_TARGETS];

export const getKoreanFieldworkReturnTarget = (
  value: string | string[] | undefined
): KoreanFieldworkReturnTarget => {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return normalizedValue === KOREAN_FIELDWORK_RETURN_TARGETS.FIELD_BOARD
    ? KOREAN_FIELDWORK_RETURN_TARGETS.FIELD_BOARD
    : KOREAN_FIELDWORK_RETURN_TARGETS.MAP;
};

export const getKoreanFieldworkReturnParam = (
  returnTarget: KoreanFieldworkReturnTarget
): { returnTo: KoreanFieldworkReturnTarget } => ({
  returnTo: returnTarget,
});

export const navigateToKoreanFieldworkReturnTarget = (
  returnTarget: KoreanFieldworkReturnTarget,
  highlightedDocId?: string
) => {
  if (returnTarget === KOREAN_FIELDWORK_RETURN_TARGETS.FIELD_BOARD) {
    router.navigate('/ProjectScreen');
    return;
  }

  router.navigate({
    pathname: '/ProjectScreen/DocumentsMap',
    params: highlightedDocId ? { highlightedDocId } : {},
  });
};
