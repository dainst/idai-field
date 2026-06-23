import {
  buildKoreanFieldworkHandwritingNoteText,
  extractKoreanFieldworkHandwritingFromText,
  normalizeKoreanFieldworkHandwritingStrokes,
  serializeKoreanFieldworkHandwriting,
} from './korean-fieldwork-handwriting';

describe('Korean fieldwork handwriting', () => {
  it('serializes handwriting strokes into field note text', () => {
    const strokes = [
      { points: [{ x: 10.4, y: 20.5 }, { x: 40, y: 50 }] },
    ];

    const text = buildKoreanFieldworkHandwritingNoteText(strokes);

    expect(text).toContain('[손그림 메모] 획 1개, 점 2개');
    expect(text).toContain('[손그림 좌표]');
    expect(extractKoreanFieldworkHandwritingFromText(text)).toEqual([
      { points: [{ x: 10, y: 21 }, { x: 40, y: 50 }] },
    ]);
  });

  it('normalizes invalid stroke payloads before saving', () => {
    expect(normalizeKoreanFieldworkHandwritingStrokes({
      version: 1,
      strokes: [
        { points: [{ x: -10, y: 20.2 }, { x: 'bad', y: 0 }] },
        { points: [] },
      ],
    })).toEqual([
      { points: [{ x: 0, y: 20 }] },
    ]);
    expect(serializeKoreanFieldworkHandwriting([]))
      .toBe('{"version":1,"strokes":[]}');
  });
});
