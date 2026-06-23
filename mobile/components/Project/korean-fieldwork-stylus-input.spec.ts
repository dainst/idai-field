import { isKoreanFieldworkStylusPointer } from './korean-fieldwork-stylus-input';

describe('Korean fieldwork stylus input', () => {
  it('detects pen-like pointer types from tablet input events', () => {
    expect(isKoreanFieldworkStylusPointer('pen')).toBe(true);
    expect(isKoreanFieldworkStylusPointer(' stylus ')).toBe(true);
    expect(isKoreanFieldworkStylusPointer('touch')).toBe(false);
    expect(isKoreanFieldworkStylusPointer(undefined)).toBe(false);
  });
});
