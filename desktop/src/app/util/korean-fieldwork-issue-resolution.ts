import {
    Document,
    KoreanFieldworkReadinessIssue
} from 'idai-field-core';
import { KoreanFieldworkRecordActionTone } from './korean-fieldwork-record-actions';


export type KoreanFieldworkIssueResolutionActionType = 'updateFields'|'createDocument';

export interface KoreanFieldworkIssueResolutionAction {
    id: string;
    type: KoreanFieldworkIssueResolutionActionType;
    label: string;
    detail: string;
    icon: string;
    tone: KoreanFieldworkRecordActionTone;
    updates?: Record<string, unknown>;
    categoryName?: string;
}

const FEATURE_CHECKLIST_FIELD = 'featureInvestigationChecklist';
const RECORD_CREATION_TIMING_FIELD = 'recordCreationTiming';
const SOIL_PROFILE_PHOTO_CATEGORY = 'SoilProfilePhoto';


export function getKoreanFieldworkIssueResolutionAction(
        issue: KoreanFieldworkReadinessIssue,
        document: Document,
        allowedAddCategoryNames: string[] = []
): KoreanFieldworkIssueResolutionAction|undefined {

    if (issue.documentId !== document.resource.id) return undefined;

    switch (issue.ruleId) {
        case 'feature-complete-photo':
            return createChecklistUpdateAction(
                issue,
                document,
                '완료사진 체크',
                '현장에서 확인한 완료 사진 항목을 과정표에 반영합니다.',
                'mdi-camera-check-outline',
                ['completionPhotoTaken']
            );
        case 'finds-recovered-pre-photo':
            return createChecklistUpdateAction(
                issue,
                document,
                '수습 전 사진 체크',
                '유물 수습 전 사진 확인 상태를 과정표에 반영합니다.',
                'mdi-package-check',
                ['preRecoveryFindPhotoTaken']
            );
        case 'field-only-timing':
            return {
                id: `resolve-${issue.ruleId}`,
                type: 'updateFields',
                label: '현장 한정 표시',
                detail: '현장에서만 확인 가능한 관찰로 기록 시점을 표시합니다.',
                icon: 'mdi-calendar-clock',
                tone: 'warning',
                updates: {
                    [RECORD_CREATION_TIMING_FIELD]: 'fieldOnlyObservation'
                }
            };
        case 'soil-profile-photo-count':
            if (!allowedAddCategoryNames.includes(SOIL_PROFILE_PHOTO_CATEGORY)) return undefined;

            return {
                id: `resolve-${issue.ruleId}`,
                type: 'createDocument',
                label: '토층사진 추가',
                detail: '부족한 토층사진 기록을 현재 기록에 붙입니다.',
                icon: 'mdi-terrain',
                tone: 'warning',
                categoryName: SOIL_PROFILE_PHOTO_CATEGORY
            };
        default:
            return undefined;
    }
}


function createChecklistUpdateAction(issue: KoreanFieldworkReadinessIssue,
                                     document: Document,
                                     label: string,
                                     detail: string,
                                     icon: string,
                                     checklistValues: string[]): KoreanFieldworkIssueResolutionAction {

    return {
        id: `resolve-${issue.ruleId}`,
        type: 'updateFields',
        label,
        detail,
        icon,
        tone: issue.severity === 'critical' ? 'danger' : 'warning',
        updates: {
            [FEATURE_CHECKLIST_FIELD]: mergeChecklistValues(document, checklistValues)
        }
    };
}


function mergeChecklistValues(document: Document, checklistValues: string[]): string[] {

    const existingValue = document.resource[FEATURE_CHECKLIST_FIELD];
    const mergedValues = Array.isArray(existingValue)
        ? existingValue.filter((value): value is string => typeof value === 'string')
        : [];

    checklistValues.forEach(value => {
        if (!mergedValues.includes(value)) mergedValues.push(value);
    });

    return mergedValues;
}
