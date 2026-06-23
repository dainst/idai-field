export interface KoreanFieldworkPointerInputEvent {
  nativeEvent?: {
    locationX?: unknown;
    locationY?: unknown;
    pointerType?: unknown;
  };
}

const STYLUS_POINTER_TYPES = new Set(['pen', 'stylus']);

export const isKoreanFieldworkStylusPointer = (
  pointerType: unknown
): boolean =>
  typeof pointerType === 'string'
  && STYLUS_POINTER_TYPES.has(pointerType.trim().toLowerCase());
