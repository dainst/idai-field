import { Document, KoreanFieldworkReadinessIssue } from 'idai-field-core';
import {
  getKoreanFieldworkCloseoutBatchUpdates,
  getKoreanFieldworkCloseoutIssueActions,
} from './korean-fieldwork-closeout-actions';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork closeout actions', () => {
  it('maps closeout issues to runnable resolution actions', () => {
    const feature = createDoc('feature-1', C.FEATURE, {
      featureInvestigationChecklist: ['measuredDrawingCompleted'],
    });
    const issue = createIssue('feature-complete-photo', 'feature-1');

    const [action] = getKoreanFieldworkCloseoutIssueActions(
      [issue],
      new Map([[feature.resource.id, feature]]),
      () => []
    );

    expect(action.document).toBe(feature);
    expect(action.resolutionAction).toMatchObject({
      type: 'updateFields',
      updates: {
        featureInvestigationChecklist: [
          'measuredDrawingCompleted',
          'completionPhotoTaken',
        ],
      },
    });
  });

  it('keeps create-document resolutions out of the batch update plan', () => {
    const feature = createDoc('feature-1', C.FEATURE);
    const issue = createIssue('soil-profile-photo-count', 'feature-1');
    const issueActions = getKoreanFieldworkCloseoutIssueActions(
      [issue],
      new Map([[feature.resource.id, feature]]),
      () => [C.SOIL_PROFILE_PHOTO]
    );

    expect(issueActions[0].resolutionAction).toMatchObject({
      type: 'createDocument',
      categoryName: C.SOIL_PROFILE_PHOTO,
    });
    expect(getKoreanFieldworkCloseoutBatchUpdates(issueActions)).toEqual([]);
  });

  it('merges multiple checklist fixes for the same record', () => {
    const feature = createDoc('feature-1', C.FEATURE, {
      featureInvestigationChecklist: ['findsRecovered'],
    });
    const issueActions = getKoreanFieldworkCloseoutIssueActions(
      [
        createIssue('feature-complete-photo', 'feature-1'),
        createIssue('finds-recovered-pre-photo', 'feature-1'),
      ],
      new Map([[feature.resource.id, feature]]),
      () => []
    );

    expect(getKoreanFieldworkCloseoutBatchUpdates(issueActions)).toMatchObject([
      {
        document: feature,
        issueCount: 2,
        updates: {
          featureInvestigationChecklist: [
            'findsRecovered',
            'completionPhotoTaken',
            'preRecoveryFindPhotoTaken',
          ],
        },
      },
    ]);
  });
});

const createDoc = (
  id: string,
  category: string,
  extraResource: Record<string, unknown> = {}
): Document => ({
  _id: id,
  created: { user: 'test', date: new Date('2026-06-23T00:00:00.000Z') },
  modified: [],
  resource: {
    id,
    identifier: id,
    category,
    relations: {},
    ...extraResource,
  },
});

const createIssue = (
  ruleId: string,
  documentId: string
): KoreanFieldworkReadinessIssue => ({
  ruleId,
  documentId,
  identifier: documentId,
  category: C.FEATURE,
  severity: 'warning',
  message: '확인 필요',
  relatedFields: ['featureInvestigationChecklist'],
  recommendedAction: '현장에서 확인하세요.',
  blocksSave: false,
});
