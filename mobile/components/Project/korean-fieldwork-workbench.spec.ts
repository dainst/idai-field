import {
  KoreanFieldworkReadinessIssue,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import { getKoreanFieldworkWorkbenchItems } from './korean-fieldwork-workbench';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork workbench', () => {
  it('prioritizes records that need field decisions and preserves their context path', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
      fieldRecordQuality: ['immediateRecording'],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {
      liesWithin: ['operation-1'],
    }, {
      fieldRecordQuality: [],
      recordCreationTiming: '',
      verificationState: 'observedInField',
    });
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      liesWithin: ['trench-1'],
    }, {
      featureRecordingStatus: 'candidate',
      featureInvestigationChecklist: ['preInvestigationPhotoTaken'],
      fieldRecordQuality: [],
      recordCreationTiming: '',
      verificationState: 'pendingDecision',
    });
    const summary = createSummary([createIssue('feature-1')]);

    const items = getKoreanFieldworkWorkbenchItems(
      summary,
      [operation, trench, feature] as any
    );

    expect(items.map((item) => ({
      id: item.id,
      categoryLabel: item.categoryLabel,
      parentPath: item.parentPath,
      reasons: item.reasons,
      tone: item.tone,
    }))).toEqual([
      {
        id: 'feature-1',
        categoryLabel: '유구',
        parentPath: '조사구역 1 > T1',
        reasons: ['확인 1', '유구 후보', '과정 1/8', '기록 보완'],
        tone: 'warning',
      },
      {
        id: 'trench-1',
        categoryLabel: '트렌치',
        parentPath: '조사구역 1',
        reasons: ['기록 보완', '시점 미입력'],
        tone: 'neutral',
      },
    ]);
  });

  it('omits records that have no active tablet workbench reason', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
      fieldRecordQuality: ['immediateRecording'],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });

    expect(getKoreanFieldworkWorkbenchItems(
      createSummary([]),
      [operation] as any
    )).toEqual([]);
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {},
  extraResource: Record<string, unknown> = {}
) => ({
  resource: {
    id,
    identifier,
    category,
    relations,
    ...extraResource,
  },
});

const createSummary = (
  openIssues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkTodaySummary => ({
  dailyLogs: [],
  surveyBoundaries: [],
  featureCandidates: [],
  openIssues,
  issueCountByDocumentId: openIssues.reduce((index, issue) => {
    index[issue.documentId] = (index[issue.documentId] ?? 0) + 1;
    return index;
  }, {} as Record<string, number>),
});

const createIssue = (
  documentId: string
): KoreanFieldworkReadinessIssue => ({
  ruleId: 'test-rule',
  documentId,
  identifier: '수혈 1',
  category: C.FEATURE,
  severity: 'warning',
  message: '확인 필요',
  relatedFields: ['featureInvestigationChecklist'],
  recommendedAction: '현장에서 확인하세요.',
  blocksSave: false,
});
