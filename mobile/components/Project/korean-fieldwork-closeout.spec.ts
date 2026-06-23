import { getKoreanFieldworkCloseoutSummary } from './korean-fieldwork-closeout';

describe('Korean fieldwork closeout summary', () => {
  it('blocks closeout when critical issues remain', () => {
    const summary = getKoreanFieldworkCloseoutSummary([
      createIssue('warning', 'feature-2', '주의 유구', 'w'),
      createIssue('critical', 'feature-1', '중대 유구', 'c'),
      createIssue('info', 'sample-1', '참고 시료', 'i'),
    ] as any);

    expect(summary.status).toBe('blocked');
    expect(summary.title).toBe('마감 보완');
    expect(summary.counts).toEqual({ critical: 1, warning: 1, info: 1 });
    expect(summary.issues.map((issue) => issue.ruleId)).toEqual(['c', 'w', 'i']);
  });

  it('keeps a review state for warning and info issues', () => {
    const summary = getKoreanFieldworkCloseoutSummary([
      createIssue('info', 'find-1', '유물', 'i'),
      createIssue('warning', 'feature-1', '유구', 'w'),
    ] as any);

    expect(summary.status).toBe('needsReview');
    expect(summary.title).toBe('마감 전 확인');
    expect(summary.detail).toBe('주의 1건, 참고 1건이 남아 있습니다.');
  });

  it('returns a clear state when no issues remain', () => {
    const summary = getKoreanFieldworkCloseoutSummary([]);

    expect(summary.status).toBe('clear');
    expect(summary.title).toBe('마감 가능');
    expect(summary.issues).toEqual([]);
  });
});

const createIssue = (
  severity: 'critical'|'warning'|'info',
  documentId: string,
  identifier: string,
  ruleId: string
) => ({
  severity,
  documentId,
  identifier,
  ruleId,
  category: 'Feature',
  message: 'message',
  relatedFields: [],
  recommendedAction: '확인하세요.',
  blocksSave: false,
});
