import {
  getKoreanFieldworkReturnParam,
  getKoreanFieldworkReturnTarget,
  KOREAN_FIELDWORK_RETURN_TARGETS,
  navigateToKoreanFieldworkReturnTarget,
} from './korean-fieldwork-navigation';

const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  },
}));

describe('Korean fieldwork navigation helpers', () => {
  afterEach(() => mockNavigate.mockClear());

  it('normalizes field-board return targets', () => {
    expect(getKoreanFieldworkReturnTarget('fieldBoard'))
      .toBe(KOREAN_FIELDWORK_RETURN_TARGETS.FIELD_BOARD);
    expect(getKoreanFieldworkReturnTarget(['fieldBoard']))
      .toBe(KOREAN_FIELDWORK_RETURN_TARGETS.FIELD_BOARD);
  });

  it('falls back to map return target for missing or unknown values', () => {
    expect(getKoreanFieldworkReturnTarget(undefined))
      .toBe(KOREAN_FIELDWORK_RETURN_TARGETS.MAP);
    expect(getKoreanFieldworkReturnTarget('unknown'))
      .toBe(KOREAN_FIELDWORK_RETURN_TARGETS.MAP);
  });

  it('serializes return target params for route handoff', () => {
    expect(getKoreanFieldworkReturnParam(
      KOREAN_FIELDWORK_RETURN_TARGETS.FIELD_BOARD
    )).toEqual({ returnTo: 'fieldBoard' });
  });

  it('returns to the field board without map highlight params', () => {
    navigateToKoreanFieldworkReturnTarget(
      KOREAN_FIELDWORK_RETURN_TARGETS.FIELD_BOARD,
      'doc-1'
    );

    expect(mockNavigate).toHaveBeenCalledWith('/ProjectScreen');
  });

  it('returns to the map with a highlighted document when requested', () => {
    navigateToKoreanFieldworkReturnTarget(
      KOREAN_FIELDWORK_RETURN_TARGETS.MAP,
      'doc-1'
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/ProjectScreen/DocumentsMap',
      params: { highlightedDocId: 'doc-1' },
    });
  });
});
