import { Document } from 'idai-field-core';
import {
    getKoreanFieldworkInvestigationModeLabel,
    getKoreanFieldworkProjectResourceValue,
    KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD,
    KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
} from './korean-fieldwork-project-setup';
import {
    getKoreanFieldworkBoundarySummaryLabel,
    getKoreanFieldworkSurveyBoundaryDocuments
} from './korean-fieldwork-boundary-summary';
import {
    KOREAN_FIELDWORK_BOUNDARY_IMPORT_SYNC_DETAIL
} from './korean-fieldwork-boundary-import-guidance';
import { getLegacyRootDocumentsForOperation } from './korean-fieldwork-operation-wrap';


export type KoreanFieldworkScopeSummaryTone = 'success'|'warning'|'info';

export interface KoreanFieldworkScopeSummaryAction {
    type: 'openProjectInfo'|'openMap'|'openImport';
}

export interface KoreanFieldworkScopeSummary {
    tone: KoreanFieldworkScopeSummaryTone;
    title: string;
    detail: string;
    modeLabel: string;
    boundaryLabel: string;
    structureCount: number;
    evidenceCount: number;
    reviewCount: number;
    issueCount: number;
    legacyRootRecordCount: number;
    actionLabel: string;
    action: KoreanFieldworkScopeSummaryAction;
    secondaryActionDetail?: string;
    secondaryActionLabel?: string;
    secondaryAction?: KoreanFieldworkScopeSummaryAction;
}


const STRUCTURE_CATEGORIES = ['Operation', 'Trench', 'FeatureGroup', 'Feature', 'FeatureSegment', 'Layer'];
const EVIDENCE_CATEGORIES = ['Find', 'FindCollection', 'Sample', 'Photo', 'SoilProfilePhoto', 'Drawing'];
const REVIEW_CATEGORIES = ['DailyLog', 'FieldRecordQualityReview', 'SourceEvidenceIndex', 'SurveyBoundary'];


export function makeKoreanFieldworkScopeSummary(documents: Document[],
                                                projectDocument: Document|undefined,
                                                issueCount: number = 0): KoreanFieldworkScopeSummary {

    const modeId = getKoreanFieldworkProjectResourceValue(
        projectDocument,
        KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
    );
    const boundarySummary = getKoreanFieldworkProjectResourceValue(
        projectDocument,
        KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD
    )?.trim();
    const modeLabel = modeId
        ? getKoreanFieldworkInvestigationModeLabel(modeId)
        : '조사 방식 없음';
    const categoryCounts = countCategories(documents);
    const operationCount = categoryCounts.get('Operation') ?? 0;
    const surveyBoundaryDocuments = getKoreanFieldworkSurveyBoundaryDocuments(documents);
    const boundaryCount = surveyBoundaryDocuments.length;
    const structureCount = countCategoryGroup(categoryCounts, STRUCTURE_CATEGORIES);
    const evidenceCount = countCategoryGroup(categoryCounts, EVIDENCE_CATEGORIES);
    const reviewCount = countCategoryGroup(categoryCounts, REVIEW_CATEGORIES);
    const boundaryLabel = getKoreanFieldworkBoundarySummaryLabel(surveyBoundaryDocuments, boundarySummary);
    const legacyRootRecordCount = getLegacyRootDocumentsForOperation(documents).length;

    if (!modeId) {
        return {
            tone: 'warning',
            title: '조사 방식 미정',
            detail: '프로젝트 정보에서 이번 조사의 종류를 먼저 정하세요.',
            modeLabel,
            boundaryLabel,
            structureCount,
            evidenceCount,
            reviewCount,
            issueCount,
            legacyRootRecordCount,
            actionLabel: '프로젝트 정보',
            action: { type: 'openProjectInfo' }
        };
    }

    if (operationCount === 0) {
        return {
            tone: legacyRootRecordCount > 0 ? 'warning' : 'info',
            title: legacyRootRecordCount > 0 ? '조사 구역 정리 필요' : '조사 경계 필요',
            detail: legacyRootRecordCount > 0
                ? `${modeLabel} · 부모 없이 떠 있는 기존 기록 ${legacyRootRecordCount}건을 새 조사 구역 안으로 정리하세요.`
                : `${modeLabel} · 지도에서 GPS 임시 경계, SHP/DXF/CSV, 위성지도 중 하나로 조사 경계를 먼저 만드세요.`,
            modeLabel,
            boundaryLabel,
            structureCount,
            evidenceCount,
            reviewCount,
            issueCount,
            legacyRootRecordCount,
            actionLabel: '지도',
            action: { type: 'openMap' }
        };
    }

    if (boundaryCount === 0) {
        const hasBoundarySummary = !!boundarySummary;

        return {
            tone: 'warning',
            title: hasBoundarySummary ? '조사 구역 확정 필요' : '조사 구역 필요',
            detail: hasBoundarySummary
                ? `${modeLabel} · ${boundarySummary} 기준만 있음. GPS 임시 경계, SHP/DXF/CSV, 위성지도 중 하나로 확정하세요.`
                : `${modeLabel} · GPS 임시 경계, SHP/DXF/CSV, 위성지도 기준으로 확정한 경계가 없습니다.`,
            modeLabel,
            boundaryLabel,
            structureCount,
            evidenceCount,
            reviewCount,
            issueCount,
            legacyRootRecordCount,
            actionLabel: '지도',
            action: { type: 'openMap' },
            secondaryActionDetail: KOREAN_FIELDWORK_BOUNDARY_IMPORT_SYNC_DETAIL,
            secondaryActionLabel: '가져오기',
            secondaryAction: { type: 'openImport' }
        };
    }

    if (structureCount === 0) {
        return {
            tone: 'info',
            title: '조사 구역 기록 필요',
            detail: `${modeLabel} · ${boundaryLabel}`,
            modeLabel,
            boundaryLabel,
            structureCount,
            evidenceCount,
            reviewCount,
            issueCount,
            legacyRootRecordCount,
            actionLabel: '지도',
            action: { type: 'openMap' }
        };
    }

    return {
        tone: issueCount > 0 ? 'info' : 'success',
        title: '조사 범위 준비',
        detail: `${modeLabel} · ${boundaryLabel}`,
        modeLabel,
        boundaryLabel,
        structureCount,
        evidenceCount,
        reviewCount,
        issueCount,
        legacyRootRecordCount,
        actionLabel: '지도',
        action: { type: 'openMap' }
    };
}


function countCategories(documents: Document[]): Map<string, number> {

    return documents.reduce((counts, document) => {
        const categoryName = document.resource.category;
        if (!categoryName) return counts;

        counts.set(categoryName, (counts.get(categoryName) ?? 0) + 1);
        return counts;
    }, new Map<string, number>());
}


function countCategoryGroup(categoryCounts: Map<string, number>, categoryNames: string[]): number {

    return categoryNames.reduce(
        (count, categoryName) => count + (categoryCounts.get(categoryName) ?? 0),
        0
    );
}
