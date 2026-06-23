import {
  Document,
  KoreanFieldworkReadinessIssue,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import { getKoreanFieldworkProgressItems } from './korean-fieldwork-progress';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork progress', () => {
  it('marks an operation without trenches as setup work', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
      fieldRecordQuality: [],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });

    expect(getKoreanFieldworkProgressItems(createSummary([]), [operation]))
      .toMatchObject([
        {
          id: 'operation-1',
          stageId: 'setup',
          stageLabel: '착수',
          tone: 'warning',
          actionLabel: '트렌치 추가',
          action: {
            type: 'createDocument',
            parentDocumentId: 'operation-1',
            categoryName: C.TRENCH,
          },
          metrics: {
            hierarchyCount: 0,
            issueCount: 0,
          },
        },
      ]);
  });

  it('prioritizes scoped closeout issues above lower progress stages', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {
      liesWithin: ['operation-1'],
    });
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      liesWithin: ['trench-1'],
    }, {
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: [
        'preInvestigationPhotoTaken',
        'inProgressPhotoTaken',
        'soilProfilePhotoLinked',
        'measuredDrawingCompleted',
        'preRecoveryFindPhotoTaken',
        'findsRecovered',
        'samplesCollected',
        'completionPhotoTaken',
      ],
      fieldRecordQuality: ['immediateRecording'],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });
    const issue = createIssue('feature-1', 'critical');

    const items = getKoreanFieldworkProgressItems(
      createSummary([issue]),
      [operation, trench, feature]
    );

    expect(items.find((item) => item.id === 'operation-1')).toMatchObject({
      stageId: 'review',
      tone: 'danger',
      detail: '마감 전 확인 1건을 먼저 처리하세요.',
      action: {
        type: 'openDocument',
        documentId: 'feature-1',
      },
      metrics: {
        hierarchyCount: 2,
        issueCount: 1,
        checklistDone: 8,
        checklistTotal: 8,
      },
    });
  });

  it('marks a documented feature with evidence as closeout-ready', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {}, {
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: [
        'preInvestigationPhotoTaken',
        'inProgressPhotoTaken',
        'soilProfilePhotoLinked',
        'measuredDrawingCompleted',
        'preRecoveryFindPhotoTaken',
        'findsRecovered',
        'samplesCollected',
        'completionPhotoTaken',
      ],
      fieldRecordQuality: ['immediateRecording'],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });
    const photo = createDoc('photo-1', C.PHOTO, '사진 1', {
      depicts: ['feature-1'],
    });

    expect(getKoreanFieldworkProgressItems(createSummary([]), [feature, photo]))
      .toMatchObject([
        {
          id: 'feature-1',
          stageId: 'closeout',
          stageLabel: '마감',
          tone: 'success',
          metrics: {
            evidenceCount: 1,
            checklistDone: 8,
            checklistTotal: 8,
          },
        },
      ]);
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {},
  extraResource: Record<string, unknown> = {}
): Document => ({
  _id: id,
  created: { user: 'test', date: new Date('2026-06-23T00:00:00.000Z') },
  modified: [],
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
  documentId: string,
  severity: KoreanFieldworkReadinessIssue['severity']
): KoreanFieldworkReadinessIssue => ({
  ruleId: 'test-rule',
  documentId,
  identifier: '수혈 1',
  category: C.FEATURE,
  severity,
  message: '확인 필요',
  relatedFields: ['featureInvestigationChecklist'],
  recommendedAction: '현장에서 확인하세요.',
  blocksSave: severity === 'critical',
});
