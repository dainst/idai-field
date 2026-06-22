import { KoreanFieldworkReadinessIssue } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import { getKoreanFieldworkIssueResolutionAction } from './korean-fieldwork-issue-resolution';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork issue resolution actions', () => {
  it('creates a checklist update action for confirmed features missing completion photos', () => {
    const feature = createDoc('feature-1', C.FEATURE, {
      featureInvestigationChecklist: ['measuredDrawingCompleted'],
    });

    expect(getKoreanFieldworkIssueResolutionAction(
      createIssue('feature-complete-photo', 'feature-1'),
      feature as any
    )).toMatchObject({
      type: 'updateFields',
      label: '완료사진 체크',
      updates: {
        featureInvestigationChecklist: [
          'measuredDrawingCompleted',
          'completionPhotoTaken',
        ],
      },
    });
  });

  it('creates a soil profile photo draft action only when the category is allowed', () => {
    const feature = createDoc('feature-1', C.FEATURE);
    const issue = createIssue('soil-profile-photo-count', 'feature-1');

    expect(getKoreanFieldworkIssueResolutionAction(
      issue,
      feature as any,
      []
    )).toBeUndefined();

    expect(getKoreanFieldworkIssueResolutionAction(
      issue,
      feature as any,
      [C.SOIL_PROFILE_PHOTO]
    )).toMatchObject({
      type: 'createDocument',
      label: '토층사진 추가',
      categoryName: C.SOIL_PROFILE_PHOTO,
    });
  });

  it('does not resolve issues that belong to another record', () => {
    expect(getKoreanFieldworkIssueResolutionAction(
      createIssue('feature-complete-photo', 'feature-2'),
      createDoc('feature-1', C.FEATURE) as any
    )).toBeUndefined();
  });
});

const createDoc = (
  id: string,
  category: string,
  extraResource: Record<string, unknown> = {}
) => ({
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
