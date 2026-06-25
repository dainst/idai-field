import {
  Document,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import { FIELDWORK_QUICK_FIELDS } from './korean-fieldwork-quick-record';
import { KoreanFieldworkStatusTone } from './korean-fieldwork-record-summary';

export type KoreanFieldworkIssueResolutionActionType =
  'updateFields'
  | 'createDocument';

export interface KoreanFieldworkIssueResolutionAction {
  id: string;
  type: KoreanFieldworkIssueResolutionActionType;
  label: string;
  detail: string;
  icon: string;
  tone: KoreanFieldworkStatusTone;
  updates?: Record<string, unknown>;
  categoryName?: string;
}

const C = KOREAN_FIELDWORK_CATEGORIES;

export const getKoreanFieldworkIssueResolutionAction = (
  issue: KoreanFieldworkReadinessIssue,
  document: Document,
  allowedAddCategoryNames: string[] = []
): KoreanFieldworkIssueResolutionAction | undefined => {
  if (issue.documentId !== document.resource.id) return undefined;

  switch (issue.ruleId) {
    case 'feature-complete-photo':
      return createChecklistUpdateAction(
        issue,
        document,
        '완료사진 체크',
        '현장에서 확인한 완료 사진 항목을 과정표에 반영합니다.',
        'photo-camera',
        ['completionPhotoTaken']
      );
    case 'finds-recovered-pre-photo':
      return createChecklistUpdateAction(
        issue,
        document,
        '수습 전 사진 체크',
        '유물 수습 전 사진 확인 상태를 과정표에 반영합니다.',
        'inventory-2',
        ['preRecoveryFindPhotoTaken']
      );
    case 'field-only-timing':
      return {
        id: `resolve-${issue.ruleId}`,
        type: 'updateFields',
        label: '현장 한정 표시',
        detail: '현장에서만 확인 가능한 관찰로 기록 시점을 표시합니다.',
        icon: 'schedule',
        tone: 'warning',
        updates: {
          [FIELDWORK_QUICK_FIELDS.timing]: 'fieldOnlyObservation',
        },
      };
    case 'soil-profile-photo-count':
      if (!allowedAddCategoryNames.includes(C.SOIL_PROFILE_PHOTO)) return undefined;
      return {
        id: `resolve-${issue.ruleId}`,
        type: 'createDocument',
        label: '토층사진 추가',
        detail: '부족한 토층사진 기록을 현재 기록에 붙입니다.',
        icon: 'terrain',
        tone: 'warning',
        categoryName: C.SOIL_PROFILE_PHOTO,
      };
    default:
      return undefined;
  }
};

const createChecklistUpdateAction = (
  issue: KoreanFieldworkReadinessIssue,
  document: Document,
  label: string,
  detail: string,
  icon: string,
  checklistValues: string[]
): KoreanFieldworkIssueResolutionAction => ({
  id: `resolve-${issue.ruleId}`,
  type: 'updateFields',
  label,
  detail,
  icon,
  tone: issue.severity === 'critical' ? 'danger' : 'warning',
  updates: {
    [FIELDWORK_QUICK_FIELDS.checklist]: mergeChecklistValues(
      document,
      checklistValues
    ),
  },
});

const mergeChecklistValues = (
  document: Document,
  checklistValues: string[]
): string[] => {
  const resource = document.resource as unknown as Record<string, unknown>;
  const existingChecklist = resource[FIELDWORK_QUICK_FIELDS.checklist];
  const mergedValues = Array.isArray(existingChecklist)
    ? existingChecklist
      .filter((value): value is string => typeof value === 'string')
    : [];

  checklistValues.forEach((value) => {
    if (!mergedValues.includes(value)) mergedValues.push(value);
  });

  return mergedValues;
};
