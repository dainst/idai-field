import { Document } from 'idai-field-core';
import {
    getKoreanFieldworkProjectResourceValue,
    KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD,
    KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
} from './korean-fieldwork-project-setup';
import { KoreanFieldworkTodayStats } from './korean-fieldwork-today-stats';
import {
    getKoreanFieldworkBoundarySummaryLabel,
    getKoreanFieldworkSurveyBoundaryDocuments
} from './korean-fieldwork-boundary-summary';
import {
    KOREAN_FIELDWORK_BOUNDARY_IMPORT_SYNC_DETAIL
} from './korean-fieldwork-boundary-import-guidance';


export type KoreanFieldworkWorkflowStepStatus = 'done'|'current'|'attention'|'todo';

export type KoreanFieldworkWorkflowAction =
    | { type: 'openProjectInfo' }
    | { type: 'openMap' }
    | { type: 'openImport' }
    | { type: 'openDocument', documentId: string };

export interface KoreanFieldworkWorkflowStep {
    id: string;
    label: string;
    detail: string;
    status: KoreanFieldworkWorkflowStepStatus;
    action?: KoreanFieldworkWorkflowAction;
    actionLabel?: string;
    secondaryAction?: KoreanFieldworkWorkflowAction;
    secondaryActionDetail?: string;
    secondaryActionLabel?: string;
}

interface WorkflowStepDraft {
    id: string;
    label: string;
    doneDetail: string;
    nextDetail: string;
    done: boolean;
    attention?: boolean;
    action?: KoreanFieldworkWorkflowAction;
    actionLabel?: string;
    secondaryAction?: KoreanFieldworkWorkflowAction;
    secondaryActionDetail?: string;
    secondaryActionLabel?: string;
}


export function makeKoreanFieldworkWorkflowSteps(
        documents: Document[],
        projectDocument: Document|undefined,
        stats: KoreanFieldworkTodayStats
): KoreanFieldworkWorkflowStep[] {

    const investigationMode = getKoreanFieldworkProjectResourceValue(
        projectDocument,
        KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
    );
    const boundarySummary = getKoreanFieldworkProjectResourceValue(
        projectDocument,
        KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD
    );
    const categoryCounts = countCategories(documents);
    const operationCount = getCategoryCount(categoryCounts, 'Operation');
    const trenchCount = getCategoryCount(categoryCounts, 'Trench');
    const featureCount = getFeatureCount(categoryCounts);
    const primaryOperation = findFirstDocumentByCategory(documents, 'Operation');
    const dailyLog = findFirstDocumentByCategory(documents, 'DailyLog');
    const issueDocumentId = stats.priorityIssues[0]?.documentId;
    const surveyBoundaryDocuments = getKoreanFieldworkSurveyBoundaryDocuments(documents);
    const boundaryCount = surveyBoundaryDocuments.length;
    const hasBoundary = boundaryCount > 0;
    const operationReadiness = getOperationReadiness(operationCount, trenchCount, featureCount);
    const targetReadiness = getTargetReadiness(categoryCounts, documents, investigationMode);
    const hasFieldRecord = stats.dailyLogCount > 0;
    const hasCloseoutIssue = stats.openIssueCount > 0;
    const boundaryNextDetail = getBoundaryNextDetail(boundarySummary, operationCount);
    const boundaryDoneDetail = boundaryCount > 0
        ? getKoreanFieldworkBoundarySummaryLabel(surveyBoundaryDocuments, boundarySummary)
        : boundarySummary
            ? boundaryNextDetail
            : `${boundaryCount}건 기록됨`;

    const drafts: WorkflowStepDraft[] = [
        {
            id: 'project',
            label: '프로젝트',
            doneDetail: '기본 프로젝트가 열려 있습니다.',
            nextDetail: '먼저 프로젝트를 만들거나 여세요.',
            done: !!projectDocument,
            action: { type: 'openProjectInfo' },
            actionLabel: '설정'
        },
        {
            id: 'mode',
            label: '조사 선택',
            doneDetail: getInvestigationModeDetail(investigationMode),
            nextDetail: '시굴·발굴·지표·입회 중 이 프로젝트의 조사 방식을 정하세요.',
            done: !!investigationMode,
            action: { type: 'openProjectInfo' },
            actionLabel: '선택'
        },
        {
            id: 'boundary',
            label: '조사 구역',
            doneDetail: boundaryDoneDetail,
            nextDetail: boundaryNextDetail,
            done: hasBoundary,
            attention: !!boundarySummary && !hasBoundary,
            action: { type: 'openMap' },
            actionLabel: '지도',
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: KOREAN_FIELDWORK_BOUNDARY_IMPORT_SYNC_DETAIL,
            secondaryActionLabel: '가져오기'
        },
        {
            id: 'operation',
            label: operationReadiness.label,
            doneDetail: operationReadiness.doneDetail,
            nextDetail: operationReadiness.nextDetail,
            done: operationReadiness.done,
            attention: operationReadiness.attention,
            action: { type: 'openMap' },
            actionLabel: '지도'
        },
        {
            id: 'targets',
            label: targetReadiness.label,
            doneDetail: targetReadiness.doneDetail,
            nextDetail: targetReadiness.nextDetail,
            done: targetReadiness.done,
            attention: targetReadiness.attention,
            action: targetReadiness.action,
            actionLabel: targetReadiness.actionLabel
        },
        {
            id: 'recording',
            label: '야장·마감',
            doneDetail: hasCloseoutIssue
                ? `마감 전 확인 ${stats.openIssueCount}건`
                : '야장과 마감 확인 흐름이 이어져 있습니다.',
            nextDetail: '오늘 작업일지를 쓰고 사진·토층·유물·시료 확인을 이어가세요.',
            done: hasFieldRecord && !hasCloseoutIssue,
            attention: hasFieldRecord && hasCloseoutIssue,
            action: issueDocumentId
                ? { type: 'openDocument', documentId: issueDocumentId }
                : dailyLog
                    ? { type: 'openDocument', documentId: dailyLog.resource.id }
                    : primaryOperation
                        ? { type: 'openDocument', documentId: primaryOperation.resource.id }
                        : undefined,
            actionLabel: issueDocumentId
                ? '확인'
                : dailyLog
                    ? '야장'
                    : primaryOperation
                        ? '범위'
                        : undefined
        }
    ];

    return applySequentialStatus(drafts);
}


function getBoundaryNextDetail(boundarySummary: string|undefined, operationCount: number): string {

    const hasOperation = operationCount > 0;
    if (boundarySummary && hasOperation) {
        return `${boundarySummary} 기준만 있음. 지도에서 GPS 임시 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 확정하세요.`;
    }
    if (boundarySummary) {
        return `${boundarySummary} 기준만 있음. 지도에서 조사 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 확정하세요.`;
    }
    if (hasOperation) return '지도에서 GPS 임시 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 구역을 기록하세요.';

    return '지도에서 조사 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 구역을 기록하세요.';
}


function countCategories(documents: Document[]): { [categoryName: string]: number } {

    return documents.reduce((result, document) => {
        const category = document.resource.category;
        result[category] = (result[category] ?? 0) + 1;
        return result;
    }, {} as { [categoryName: string]: number });
}

function getCategoryCount(categoryCounts: { [categoryName: string]: number },
                          categoryName: string): number {

    return categoryCounts[categoryName] ?? 0;
}

function getFeatureCount(categoryCounts: { [categoryName: string]: number }): number {

    return getCategoryCount(categoryCounts, 'Feature')
        + getCategoryCount(categoryCounts, 'FeatureSegment')
        + getCategoryCount(categoryCounts, 'FeatureGroup');
}

function getOperationReadiness(operationCount: number,
                               trenchCount: number,
                               featureCount: number): Omit<WorkflowStepDraft, 'id'> {

    const rootRecordCount = trenchCount + featureCount;

    if (operationCount === 0 && rootRecordCount > 0) {
        return {
            label: '조사 구역 정리',
            doneDetail: `조사 구역 없이 떠 있는 기록 ${rootRecordCount}건`,
            nextDetail: '기존 트렌치·유구 기록을 새 조사 구역 안으로 묶어 주세요.',
            done: false,
            attention: true
        };
    }

    return {
        label: '조사 구역 기록',
        doneDetail: `조사 구역 기록 ${operationCount}건`,
        nextDetail: '지도에서 조사 경계를 만들면 그 구역 안에 트렌치·유구 기록을 이어서 넣을 수 있습니다.',
        done: operationCount > 0
    };
}

function getTargetReadiness(categoryCounts: { [categoryName: string]: number },
                            documents: Document[],
                            investigationMode: string|undefined): Omit<WorkflowStepDraft, 'id'> {

    const operationCount = getCategoryCount(categoryCounts, 'Operation');
    const trenchCount = getCategoryCount(categoryCounts, 'Trench');
    const featureCount = getFeatureCount(categoryCounts);
    const firstTargetDocument = findFirstDocumentByCategory(documents, 'Feature')
        ?? findFirstDocumentByCategory(documents, 'Trench')
        ?? findFirstDocumentByCategory(documents, 'FeatureGroup')
        ?? findFirstDocumentByCategory(documents, 'Operation');
    const targetAction = firstTargetDocument
        ? { type: 'openDocument', documentId: firstTargetDocument.resource.id } as KoreanFieldworkWorkflowAction
        : { type: 'openMap' } as KoreanFieldworkWorkflowAction;
    const targetActionLabel = firstTargetDocument ? '열기' : '지도';

    if (investigationMode === 'trialTrench') {
        return {
            label: '트렌치·유구',
            doneDetail: `트렌치 ${trenchCount} · 유구 ${featureCount}`,
            nextDetail: '시굴은 먼저 트렌치를 잡고, 확인된 유구 후보를 그 안에 기록하세요.',
            done: trenchCount > 0 || featureCount > 0,
            action: targetAction,
            actionLabel: targetActionLabel
        };
    }

    if (investigationMode === 'excavation') {
        return {
            label: '유구 추가',
            doneDetail: `유구 ${featureCount}`,
            nextDetail: '발굴은 확인된 유구를 만들고 조사 전·중·마감 기록을 이어가세요.',
            done: featureCount > 0,
            action: targetAction,
            actionLabel: targetActionLabel
        };
    }

    return {
        label: '대상 추가',
        doneDetail: `조사 구역 기록 ${operationCount} · 트렌치 ${trenchCount} · 유구 ${featureCount}`,
        nextDetail: '조사 방식에 맞게 트렌치나 유구부터 추가하세요. 필요하면 먼저 조사 구역을 지도에서 만듭니다.',
        done: operationCount > 0 || trenchCount > 0 || featureCount > 0,
        action: targetAction,
        actionLabel: targetActionLabel
    };
}

function getInvestigationModeDetail(investigationMode: string|undefined): string {

    switch (investigationMode) {
        case 'trialTrench':
            return '시굴·표본 작업 순서';
        case 'excavation':
            return '발굴 작업 순서';
        case 'surfaceSurvey':
            return '지표 작업 순서';
        case 'watchingBrief':
            return '참관·입회 작업 순서';
        default:
            return '조사 방식 미정';
    }
}

function applySequentialStatus(drafts: WorkflowStepDraft[]): KoreanFieldworkWorkflowStep[] {

    const firstIncompleteIndex = drafts.findIndex(step => !step.done);

    return drafts.map((step, index) => {
        const status = getStepStatus(step, index, firstIncompleteIndex);

        return {
            id: step.id,
            label: step.label,
            detail: step.done || step.attention ? step.doneDetail : step.nextDetail,
            status,
            action: step.action,
            actionLabel: step.actionLabel,
            secondaryAction: step.secondaryAction,
            secondaryActionDetail: step.secondaryActionDetail,
            secondaryActionLabel: step.secondaryActionLabel
        };
    });
}

function findFirstDocumentByCategory(documents: Document[], category: string): Document|undefined {

    return documents.find(document => document.resource.category === category);
}

function getStepStatus(step: WorkflowStepDraft,
                       index: number,
                       firstIncompleteIndex: number): KoreanFieldworkWorkflowStepStatus {

    if (step.attention && (firstIncompleteIndex === -1 || firstIncompleteIndex === index)) {
        return 'attention';
    }

    if (step.done) return 'done';
    if (index === firstIncompleteIndex) return 'current';

    return 'todo';
}
