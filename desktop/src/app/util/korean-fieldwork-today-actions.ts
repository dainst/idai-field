import {
    CategoryForm,
    Document,
    getKoreanFieldworkTodaySummary,
    ProjectConfiguration
} from 'idai-field-core';
import {
    getKoreanFieldworkProjectResourceValue,
    KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
} from './korean-fieldwork-project-setup';
import {
    KOREAN_FIELDWORK_BOUNDARY_IMPORT_SYNC_DETAIL
} from './korean-fieldwork-boundary-import-guidance';
import {
    canCreateKoreanFieldworkChildRecord
} from './korean-fieldwork-document-drafts';
import { getLegacyRootDocumentsForOperation } from './korean-fieldwork-operation-wrap';


export type KoreanFieldworkPriorityTaskTone = 'neutral'|'info'|'success'|'warning'|'danger';

export type KoreanFieldworkPriorityTaskAction =
    | { type: 'openDocument', documentId: string }
    | { type: 'createDocument', parentDocumentId: string, categoryName: string }
    | { type: 'openMap' }
    | { type: 'openProjectInfo' }
    | { type: 'openImport' };

export interface KoreanFieldworkPriorityTask {
    id: string;
    icon: string;
    title: string;
    detail: string;
    tone: KoreanFieldworkPriorityTaskTone;
    action: KoreanFieldworkPriorityTaskAction;
    actionLabel: string;
    secondaryAction?: KoreanFieldworkPriorityTaskAction;
    secondaryActionDetail?: string;
    secondaryActionLabel?: string;
}

const C = {
    AERIAL_MAP_LAYER: 'AerialMapLayer',
    DAILY_LOG: 'DailyLog',
    DRAWING: 'Drawing',
    FEATURE: 'Feature',
    FEATURE_GROUP: 'FeatureGroup',
    FEATURE_SEGMENT: 'FeatureSegment',
    FIND: 'Find',
    FIND_COLLECTION: 'FindCollection',
    LAYER: 'Layer',
    PEN_MEMO: 'PenMemo',
    PLACE: 'Place',
    PHOTO: 'Photo',
    SAMPLE: 'Sample',
    SOURCE_EVIDENCE_INDEX: 'SourceEvidenceIndex',
    SOIL_PROFILE_PHOTO: 'SoilProfilePhoto',
    SURVEY: 'Survey',
    SURVEY_BOUNDARY: 'SurveyBoundary',
    TRENCH: 'Trench',
    OPERATION: 'Operation'
};

const PARENT_RELATIONS = ['liesWithin', 'isRecordedInFeature', 'isRecordedIn', 'depicts'];

export function makeKoreanFieldworkPriorityTasks(
        documents: Document[],
        projectDocument: Document|undefined,
        projectConfiguration: ProjectConfiguration,
        maxTasks: number = 5
): KoreanFieldworkPriorityTask[] {

    const summary = getKoreanFieldworkTodaySummary(documents);
    const investigationMode = getKoreanFieldworkProjectResourceValue(
        projectDocument,
        KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
    );
    const targets = getActionTargets(documents);
    const tasks: KoreanFieldworkPriorityTask[] = [];
    const nonProjectDocumentCount = documents.filter(document => document.resource.id !== 'project').length;

    if (!targets.primaryOperation && nonProjectDocumentCount === 0) {
        return [{
            id: 'start-operation',
            icon: 'mdi-map-plus',
            title: '조사 경계부터 만들기',
            detail: '지도에서 GPS 임시 경계, SHP/DXF/CSV, 위성지도 중 하나로 조사 경계를 먼저 잡아야 기록 흐름이 이어집니다.',
            tone: 'warning',
            action: { type: 'openMap' },
            actionLabel: '지도 열기',
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: KOREAN_FIELDWORK_BOUNDARY_IMPORT_SYNC_DETAIL,
            secondaryActionLabel: '경계 가져오기'
        }];
    }

    if (!targets.primaryOperation) {
        const legacyRootDocuments = getLegacyRootDocumentsForOperation(documents);
        if (legacyRootDocuments.length > 0) {
            return [{
                id: 'wrap-legacy-records',
                icon: 'mdi-folder-move-outline',
                title: '조사 구역 정리',
                detail: `조사 구역 없이 떠 있는 기록 ${legacyRootDocuments.length}개를 먼저 정리하세요.`,
                tone: 'warning',
                action: { type: 'openMap' },
                actionLabel: '지도에서 정리'
            }];
        }
    }

    appendCommonTasks(tasks, documents, targets, projectConfiguration);

    switch (investigationMode) {
        case 'trialTrench':
            appendTrialTrenchTasks(tasks, documents, targets, projectConfiguration);
            break;
        case 'excavation':
            appendExcavationTasks(tasks, documents, targets, projectConfiguration);
            break;
        default:
            appendGenericTasks(tasks, documents, targets, projectConfiguration);
    }

    for (const issue of summary.openIssues.slice(0, maxTasks)) {
        tasks.push({
            id: `issue-${issue.documentId}-${issue.ruleId}`,
            icon: issue.severity === 'critical' ? 'mdi-alert-octagon-outline' : 'mdi-clipboard-check-outline',
            title: `${issue.identifier} 확인`,
            detail: issue.recommendedAction,
            tone: issue.severity === 'critical' ? 'danger' : 'warning',
            action: { type: 'openDocument', documentId: issue.documentId },
            actionLabel: '열기'
        });
    }

    return tasks.slice(0, maxTasks);
}


function appendCommonTasks(tasks: KoreanFieldworkPriorityTask[],
                           documents: Document[],
                           targets: ActionTargets,
                           projectConfiguration: ProjectConfiguration) {

    if (!targets.primaryOperation) return;

    if (!hasCategory(documents, C.DAILY_LOG)) {
        pushCreateTask(tasks, targets.primaryOperation, C.DAILY_LOG, projectConfiguration, {
            id: 'create-daily-log',
            icon: 'mdi-notebook-edit-outline',
            title: '오늘 작업일지 작성',
            detail: `${getIdentifier(targets.primaryOperation)}의 작업 범위와 관찰 내용을 남기세요.`,
            tone: 'warning',
            actionLabel: '일지 만들기'
        });
    }

    if (!hasCategory(documents, C.SURVEY_BOUNDARY)) {
        pushCreateTask(tasks, targets.primaryOperation, C.SURVEY_BOUNDARY, projectConfiguration, {
            id: 'create-survey-boundary',
            icon: 'mdi-vector-polyline',
            title: '조사 경계 기록',
            detail: 'GPS 임시 경계, 가져온 SHP/DXF/CSV, 위성지도 기준 중 무엇으로 확정했는지 조사 경계 기록에 남기세요.',
            tone: 'info',
            actionLabel: '경계 만들기',
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: KOREAN_FIELDWORK_BOUNDARY_IMPORT_SYNC_DETAIL,
            secondaryActionLabel: '파일 가져오기'
        });
    }
}


function appendGenericTasks(tasks: KoreanFieldworkPriorityTask[],
                            documents: Document[],
                            targets: ActionTargets,
                            projectConfiguration: ProjectConfiguration) {

    if (targets.primaryOperation && !hasCategory(documents, C.TRENCH)) {
        pushCreateTask(tasks, targets.primaryOperation, C.TRENCH, projectConfiguration, {
            id: 'create-trench',
            icon: 'mdi-grid',
            title: '트렌치 설정',
            detail: '시굴·발굴 구획을 잡아 유구와 피트 기록의 기준을 만드세요.',
            tone: 'info',
            actionLabel: '트렌치 만들기'
        });
    }

    if (!targets.featureCandidate && targets.featureDraftParent) {
        pushCreateTask(tasks, targets.featureDraftParent, C.FEATURE, projectConfiguration, {
            id: 'create-detected-feature',
            icon: 'mdi-map-marker-plus-outline',
            title: '유구 추가',
            detail: `${getIdentifier(targets.featureDraftParent)} 안에 새 유구 기록을 시작하세요.`,
            tone: 'info',
            actionLabel: '유구 만들기'
        });
    }
}


function appendTrialTrenchTasks(tasks: KoreanFieldworkPriorityTask[],
                                documents: Document[],
                                targets: ActionTargets,
                                projectConfiguration: ProjectConfiguration) {

    if (!targets.primaryOperation) return;

    const documentsById = toDocumentIndex(documents);
    const trench = getFirstDocumentByCategory(documents, C.TRENCH);

    if (!trench) {
        pushCreateTask(tasks, targets.primaryOperation, C.TRENCH, projectConfiguration, {
            id: 'create-trench',
            icon: 'mdi-grid',
            title: '표본·시굴 트렌치 설정',
            detail: '판 순서대로 트렌치를 만들고 위치·방향·범위를 먼저 남기세요.',
            tone: 'info',
            actionLabel: '트렌치 만들기'
        });
        return;
    }

    if (!hasDirectChildCategory(trench, C.SOIL_PROFILE_PHOTO, documents, documentsById)) {
        pushCreateTask(tasks, trench, C.SOIL_PROFILE_PHOTO, projectConfiguration, {
            id: 'create-trench-profile-photo',
            icon: 'mdi-camera-outline',
            title: '트렌치 토층사진',
            detail: '기준 단면 사진에 번호를 표시하고 번호별 토색을 남기세요.',
            tone: 'info',
            actionLabel: '토층사진'
        });
    }

    const feature = getFirstDirectChildByCategory(trench, C.FEATURE, documents, documentsById)
        ?? getFirstDocumentByCategory(documents, C.FEATURE);

    if (!feature) {
        pushCreateTask(tasks, trench, C.FEATURE, projectConfiguration, {
            id: 'create-detected-feature',
            icon: 'mdi-map-marker-plus-outline',
            title: '유구 확인 결과 기록',
            detail: '유구가 확인되면 트렌치 안에 개별 유구를 만들고 경계·충전토를 남기세요.',
            tone: 'info',
            actionLabel: '유구 만들기'
        });
    } else {
        const segment = getFirstDirectChildByCategory(feature, C.FEATURE_SEGMENT, documents, documentsById)
            ?? getFirstDocumentByCategory(documents, C.FEATURE_SEGMENT);

        if (!segment) {
            pushCreateTask(tasks, feature, C.FEATURE_SEGMENT, projectConfiguration, {
                id: 'create-trench-pit',
                icon: 'mdi-format-vertical-align-bottom',
                title: '피트 조사 기록',
                detail: `${getIdentifier(feature)}의 성격 확인 피트나 절개 단위를 따로 남기세요.`,
                tone: 'info',
                actionLabel: '피트 만들기'
            });
        }

        const profileParent = segment ?? feature;
        if (!hasDirectChildCategory(profileParent, C.SOIL_PROFILE_PHOTO, documents, documentsById)) {
            pushCreateTask(tasks, profileParent, C.SOIL_PROFILE_PHOTO, projectConfiguration, {
                id: 'create-pit-profile-photo',
                icon: 'mdi-camera-outline',
                title: '피트 토층사진',
                detail: '피트 단면 사진에 번호를 표시하고 번호별 토색을 남기세요.',
                tone: 'info',
                actionLabel: '토층사진'
            });
        }
    }

    if (!hasDirectChildCategory(trench, C.PHOTO, documents, documentsById)) {
        pushCreateTask(tasks, trench, C.PHOTO, projectConfiguration, {
            id: 'create-trench-photo',
            icon: 'mdi-camera-plus-outline',
            title: '트렌치 사진 기록',
            detail: '정방향, 사선, 기준 토층, 유구 노출 사진을 트렌치 기록에 남기세요.',
            tone: 'info',
            actionLabel: '사진 만들기'
        });
    }
}


function appendExcavationTasks(tasks: KoreanFieldworkPriorityTask[],
                               documents: Document[],
                               targets: ActionTargets,
                               projectConfiguration: ProjectConfiguration) {

    if (!targets.primaryOperation) return;

    const documentsById = toDocumentIndex(documents);
    const featureParent = getFirstDocumentByCategory(documents, C.TRENCH) ?? targets.primaryOperation;
    const feature = getFirstDocumentByCategory(documents, C.FEATURE);

    if (!feature) {
        pushCreateTask(tasks, featureParent, C.FEATURE, projectConfiguration, {
            id: 'create-detected-feature',
            icon: 'mdi-map-marker-plus-outline',
            title: '유구 기록',
            detail: '제토 뒤 확인한 유구의 성격, 경계, 조사 전 사진 흐름을 시작하세요.',
            tone: 'info',
            actionLabel: '유구 만들기'
        });
        return;
    }

    if (!hasDirectChildCategory(feature, C.PHOTO, documents, documentsById)) {
        pushCreateTask(tasks, feature, C.PHOTO, projectConfiguration, {
            id: 'create-pre-investigation-photo',
            icon: 'mdi-camera-plus-outline',
            title: '조사 전 사진',
            detail: `${getIdentifier(feature)}의 조사 전 상태를 먼저 사진으로 남기세요.`,
            tone: 'warning',
            actionLabel: '사진 만들기'
        });
    }

    const segment = getFirstDirectChildByCategory(feature, C.FEATURE_SEGMENT, documents, documentsById)
        ?? getFirstDocumentByCategory(documents, C.FEATURE_SEGMENT);

    if (!segment) {
        pushCreateTask(tasks, feature, C.FEATURE_SEGMENT, projectConfiguration, {
            id: 'create-excavation-section',
            icon: 'mdi-dock-bottom',
            title: '조사 중 기록',
            detail: '토층이 드러나는 조사 중 상태를 사진·스케치·약측과 함께 남기세요.',
            tone: 'info',
            actionLabel: '조사 중 기록'
        });
    }

    const profileParent = segment ?? feature;
    if (!hasDirectChildCategory(profileParent, C.SOIL_PROFILE_PHOTO, documents, documentsById)) {
        pushCreateTask(tasks, profileParent, C.SOIL_PROFILE_PHOTO, projectConfiguration, {
            id: 'create-excavation-profile-photo',
            icon: 'mdi-camera-outline',
            title: '토층사진',
            detail: '토층둑이나 절개면 사진에 번호를 표시하고 번호별 토색을 남기세요.',
            tone: 'info',
            actionLabel: '토층사진'
        });
    }

    if (!hasDirectChildCategory(feature, C.DRAWING, documents, documentsById)) {
        pushCreateTask(tasks, feature, C.DRAWING, projectConfiguration, {
            id: 'create-excavation-drawing',
            icon: 'mdi-drawing',
            title: '실측 기록',
            detail: '평면·단면 스케치와 약측값을 유구 설명과 함께 연결해 두세요.',
            tone: 'info',
            actionLabel: '도면 만들기'
        });
    }
}


interface ActionTargets {
    primaryOperation?: Document;
    featureCandidate?: Document;
    featureDraftParent?: Document;
}

function getActionTargets(documents: Document[]): ActionTargets {

    const primaryOperation = getFirstDocumentByCategory(documents, C.OPERATION);

    return {
        primaryOperation,
        featureCandidate: documents.find(document =>
            document.resource.category === C.FEATURE
            && document.resource.featureRecordingStatus === 'candidate'
        ),
        featureDraftParent: getFirstDocumentByCategory(documents, C.TRENCH)
            ?? getFirstDocumentByCategory(documents, C.FEATURE_GROUP)
            ?? primaryOperation
    };
}


function pushCreateTask(tasks: KoreanFieldworkPriorityTask[],
                        parentDocument: Document,
                        categoryName: string,
                        projectConfiguration: ProjectConfiguration,
                        task: Omit<KoreanFieldworkPriorityTask, 'action'>) {

    if (!canCreateChild(parentDocument, categoryName, projectConfiguration)) return;

    tasks.push({
        ...task,
        action: {
            type: 'createDocument',
            parentDocumentId: parentDocument.resource.id,
            categoryName
        }
    });
}


function canCreateChild(parentDocument: Document,
                        categoryName: string,
                        projectConfiguration: ProjectConfiguration): boolean {

    const category = getCategory(categoryName, projectConfiguration);
    return !!category && canCreateKoreanFieldworkChildRecord(category, parentDocument, projectConfiguration);
}


function getCategory(categoryName: string,
                     projectConfiguration: ProjectConfiguration): CategoryForm|undefined {

    try {
        return projectConfiguration.getCategory(categoryName);
    } catch (_) {
        return undefined;
    }
}


function hasCategory(documents: Document[],
                     categoryName: string): boolean {

    return documents.some(document => document.resource.category === categoryName);
}


function toDocumentIndex(documents: Document[]): Map<string, Document> {

    return new Map(documents.map(document => [document.resource.id, document]));
}


function getFirstDocumentByCategory(documents: Document[],
                                    categoryName: string): Document|undefined {

    return documents.find(document => document.resource.category === categoryName);
}


function getFirstDirectChildByCategory(parentDocument: Document,
                                       categoryName: string,
                                       documents: Document[],
                                       documentsById: Map<string, Document>): Document|undefined {

    return documents.find(document =>
        document.resource.category === categoryName
        && getPrimaryParent(document, documentsById)?.resource.id === parentDocument.resource.id
    );
}


function hasDirectChildCategory(parentDocument: Document,
                                categoryName: string,
                                documents: Document[],
                                documentsById: Map<string, Document>): boolean {

    return !!getFirstDirectChildByCategory(parentDocument, categoryName, documents, documentsById);
}


function getPrimaryParent(document: Document,
                          documentsById: Map<string, Document>): Document|undefined {

    const relations = document.resource.relations ?? {};

    for (const relationName of PARENT_RELATIONS) {
        const targets = relations[relationName];
        const parentId = Array.isArray(targets)
            ? targets.find(target => documentsById.has(target))
            : undefined;
        if (parentId) return documentsById.get(parentId);
    }

    return undefined;
}


function getIdentifier(document: Document): string {

    return document.resource.identifier || document.resource.id;
}
