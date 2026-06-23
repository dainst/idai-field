import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';
import { getKoreanFieldworkPrimaryParent } from './korean-fieldwork-record-summary';

const C = KOREAN_FIELDWORK_CATEGORIES;

export type KoreanFieldworkPriorityTaskTone =
  'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type KoreanFieldworkPriorityTaskAction =
  | { type: 'openDocument'; documentId: string }
  | { type: 'createDocument'; parentDocumentId: string; categoryName: string }
  | { type: 'openMap' };

export interface KoreanFieldworkPriorityTask {
  id: string;
  icon: string;
  title: string;
  detail: string;
  tone: KoreanFieldworkPriorityTaskTone;
  action: KoreanFieldworkPriorityTaskAction;
}

export interface KoreanFieldworkTodayActionTargets {
  primaryOperation?: Document;
  dailyLog?: Document;
  featureCandidate?: Document;
  featureDraftParent?: Document;
  issueDocument?: Document;
}

export type KoreanFieldworkQuickActionId =
  'dailyLog'
  | 'featureCandidate'
  | 'closeout';

export type KoreanFieldworkQuickActionIcon =
  'event-note'
  | 'grid-on'
  | 'add-location-alt'
  | 'fact-check';

export interface KoreanFieldworkQuickActionState {
  id: KoreanFieldworkQuickActionId;
  icon: KoreanFieldworkQuickActionIcon;
  label: string;
  detail: string;
  action?: KoreanFieldworkPriorityTaskAction;
  warning?: boolean;
  disabled?: boolean;
}

export const getKoreanFieldworkTodayActionTargets = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[],
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkTodayActionTargets => {
  const documentsById = new Map(documents.map((document) => [
    document.resource.id,
    document,
  ]));
  const primaryOperation = getPrimaryOperation(documents);

  return {
    primaryOperation,
    dailyLog: summary.dailyLogs[0],
    featureCandidate: summary.featureCandidates[0],
    featureDraftParent: getFeatureDraftParent(
      documents,
      primaryOperation,
      investigationModeId
    ),
    issueDocument: getFirstIssueDocument(summary, documentsById),
  };
};

export const getKoreanFieldworkQuickActionStates = (
  summary: KoreanFieldworkTodaySummary,
  targets: KoreanFieldworkTodayActionTargets,
  currentScopeParent?: Document,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): Record<KoreanFieldworkQuickActionId, KoreanFieldworkQuickActionState> => {
  const dailyLogAction = targets.dailyLog
    ? toOpenDocumentAction(targets.dailyLog)
    : targets.primaryOperation
      ? toCreateDocumentAction(targets.primaryOperation, C.DAILY_LOG)
      : undefined;
  const featureCandidateAction = getFeatureQuickAction(
    targets,
    investigationModeId
  );
  const closeoutAction = targets.issueDocument
    ? toOpenDocumentAction(targets.issueDocument)
    : undefined;

  return {
    dailyLog: {
      id: 'dailyLog',
      icon: 'event-note',
      label: '오늘 일지',
      detail: getDailyLogQuickActionDetail(
        summary,
        targets,
        currentScopeParent
      ),
      action: dailyLogAction,
      disabled: !dailyLogAction,
    },
    featureCandidate: {
      id: 'featureCandidate',
      icon: getFeatureQuickActionIcon(targets, investigationModeId),
      label: getFeatureQuickActionLabel(targets, investigationModeId),
      detail: getFeatureCandidateQuickActionDetail(
        summary,
        targets,
        currentScopeParent,
        investigationModeId
      ),
      action: featureCandidateAction,
      disabled: !featureCandidateAction,
    },
    closeout: {
      id: 'closeout',
      icon: 'fact-check',
      label: '마감 점검',
      detail: summary.openIssues.length > 0
        ? `${summary.openIssues.length}건 남음`
        : '현재 문제 없음',
      action: closeoutAction,
      warning: summary.openIssues.length > 0,
      disabled: !closeoutAction,
    },
  };
};

export const getKoreanFieldworkPriorityTasks = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[],
  maxTasks = 5,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkPriorityTask[] => {
  const targets = getKoreanFieldworkTodayActionTargets(
    summary,
    documents,
    investigationModeId
  );
  const tasks: KoreanFieldworkPriorityTask[] = [];

  if (!targets.primaryOperation && documents.length === 0) {
    tasks.push({
      id: 'start-operation',
      icon: 'map',
      title: '조사구역부터 만들기',
      detail: '지도에서 현장 조사구역을 먼저 잡아야 기록 흐름이 이어집니다.',
      tone: 'warning',
      action: { type: 'openMap' },
    });

    return tasks;
  }

  appendCommonPriorityTasks(tasks, summary, targets);

  switch (investigationModeId) {
    case 'trialTrench':
      appendTrialTrenchPriorityTasks(tasks, documents, targets);
      break;
    case 'excavation':
      appendExcavationPriorityTasks(tasks, documents, targets);
      break;
    default:
      appendGenericPriorityTasks(tasks, documents, targets);
  }

  summary.openIssues.slice(0, maxTasks).forEach((issue) => {
    tasks.push({
      id: `issue-${issue.documentId}-${issue.ruleId}`,
      icon: issue.severity === 'critical' ? 'report' : 'fact-check',
      title: `${issue.identifier} 확인`,
      detail: issue.recommendedAction,
      tone: issue.severity === 'critical' ? 'danger' : 'warning',
      action: {
        type: 'openDocument',
        documentId: issue.documentId,
      },
    });
  });

  return tasks.slice(0, maxTasks);
};

const appendCommonPriorityTasks = (
  tasks: KoreanFieldworkPriorityTask[],
  summary: KoreanFieldworkTodaySummary,
  targets: KoreanFieldworkTodayActionTargets
) => {
  if (!targets.primaryOperation) return;

  if (!targets.dailyLog) {
    tasks.push({
      id: 'create-daily-log',
      icon: 'event-note',
      title: '오늘 작업일지 작성',
      detail: `${targets.primaryOperation.resource.identifier}의 작업 범위와 관찰 내용을 남기세요.`,
      tone: 'warning',
      action: {
        type: 'createDocument',
        parentDocumentId: targets.primaryOperation.resource.id,
        categoryName: C.DAILY_LOG,
      },
    });
  }

  if (summary.surveyBoundaries.length === 0) {
    tasks.push({
      id: 'create-survey-boundary',
      icon: 'polyline',
      title: '조사경계 기록',
      detail: '구역선, 기준지도, 경계 정확도를 조사구역에 연결하세요.',
      tone: 'info',
      action: {
        type: 'createDocument',
        parentDocumentId: targets.primaryOperation.resource.id,
        categoryName: C.SURVEY_BOUNDARY,
      },
    });
  }
};

const appendGenericPriorityTasks = (
  tasks: KoreanFieldworkPriorityTask[],
  documents: Document[],
  targets: KoreanFieldworkTodayActionTargets
) => {
  if (targets.primaryOperation && !hasCategory(documents, C.TRENCH)) {
    tasks.push(createTrenchTask(targets.primaryOperation));
  }

  if (!targets.featureCandidate && targets.featureDraftParent) {
    tasks.push(createFeatureTask(targets.featureDraftParent));
  }
};

const appendTrialTrenchPriorityTasks = (
  tasks: KoreanFieldworkPriorityTask[],
  documents: Document[],
  targets: KoreanFieldworkTodayActionTargets
) => {
  if (!targets.primaryOperation) return;

  const documentsById = toDocumentIndex(documents);
  const trench = getFirstDocumentByCategory(documents, C.TRENCH);

  if (!trench) {
    tasks.push(createTrenchTask(
      targets.primaryOperation,
      '표본·시굴 트렌치 설정',
      '판 순서대로 트렌치를 만들고 위치·방향·범위를 먼저 남기세요.'
    ));
    return;
  }

  if (!hasDirectChildCategory(trench, C.LAYER, documents, documentsById)) {
    tasks.push({
      id: 'create-trench-layer',
      icon: 'layers',
      title: '트렌치 토층 기록',
      detail: `${trench.resource.identifier}의 토층 정리 상태와 기준 단면을 기록하세요.`,
      tone: 'info',
      action: toCreateDocumentAction(trench, C.LAYER),
    });
  }

  const feature = getFirstDirectChildByCategory(
    trench,
    C.FEATURE,
    documents,
    documentsById
  ) ?? getFirstDocumentByCategory(documents, C.FEATURE);

  if (!feature) {
    tasks.push(createFeatureTask(
      trench,
      '유구 확인 결과 기록',
      '유구가 확인되면 트렌치 아래에 개별 유구를 만들고 경계·충전토를 남기세요.'
    ));
  } else {
    const segment = getFirstDirectChildByCategory(
      feature,
      C.FEATURE_SEGMENT,
      documents,
      documentsById
    ) ?? getFirstDocumentByCategory(documents, C.FEATURE_SEGMENT);

    if (!segment) {
      tasks.push({
        id: 'create-trench-pit',
        icon: 'vertical-align-bottom',
        title: '피트 조사 기록',
        detail: `${feature.resource.identifier}의 성격 확인 피트나 절개 단위를 따로 남기세요.`,
        tone: 'info',
        action: toCreateDocumentAction(feature, C.FEATURE_SEGMENT),
      });
    } else if (!hasDirectChildCategory(segment, C.LAYER, documents, documentsById)) {
      tasks.push({
        id: 'create-pit-layer',
        icon: 'format-color-fill',
        title: '피트 토층 기록',
        detail: `${segment.resource.identifier}의 토층도와 토층 관찰을 이어서 기록하세요.`,
        tone: 'warning',
        action: toCreateDocumentAction(segment, C.LAYER),
      });
    }

    const profileParent = segment ?? feature;
    if (!hasDirectChildCategory(profileParent, C.SOIL_PROFILE_PHOTO, documents, documentsById)) {
      tasks.push({
        id: 'create-pit-profile-photo',
        icon: 'photo-camera',
        title: '기준 토층 사진',
        detail: '기준 단면이나 피트 토층 사진을 기록 단위에 연결하세요.',
        tone: 'info',
        action: toCreateDocumentAction(profileParent, C.SOIL_PROFILE_PHOTO),
      });
    }
  }

  if (!hasDirectChildCategory(trench, C.PHOTO, documents, documentsById)) {
    tasks.push({
      id: 'create-trench-photo',
      icon: 'add-a-photo',
      title: '트렌치 사진 기록',
      detail: '정방향, 사선, 기준 토층, 유구 노출 사진을 트렌치에 연결하세요.',
      tone: 'info',
      action: toCreateDocumentAction(trench, C.PHOTO),
    });
  }
};

const appendExcavationPriorityTasks = (
  tasks: KoreanFieldworkPriorityTask[],
  documents: Document[],
  targets: KoreanFieldworkTodayActionTargets
) => {
  if (!targets.primaryOperation) return;

  const documentsById = toDocumentIndex(documents);
  const featureParent = getFirstDocumentByCategory(documents, C.TRENCH)
    ?? targets.primaryOperation;
  const feature = getFirstDocumentByCategory(documents, C.FEATURE);

  if (!feature) {
    tasks.push(createFeatureTask(
      featureParent,
      '검출 유구 기록',
      '제토 뒤 확인한 유구의 성격, 경계, 조사 전 사진 흐름을 시작하세요.'
    ));
    return;
  }

  if (!hasDirectChildCategory(feature, C.PHOTO, documents, documentsById)) {
    tasks.push({
      id: 'create-pre-investigation-photo',
      icon: 'add-a-photo',
      title: '조사 전 사진',
      detail: `${feature.resource.identifier}의 조사 전 상태를 먼저 사진으로 남기세요.`,
      tone: 'warning',
      action: toCreateDocumentAction(feature, C.PHOTO),
    });
  }

  const segment = getFirstDirectChildByCategory(
    feature,
    C.FEATURE_SEGMENT,
    documents,
    documentsById
  ) ?? getFirstDocumentByCategory(documents, C.FEATURE_SEGMENT);

  if (!segment) {
    tasks.push({
      id: 'create-excavation-section',
      icon: 'splitscreen',
      title: '반절·토층둑 기록',
      detail: '반절 조사, 토층둑, 절개면처럼 조사 중 판단 단위를 따로 남기세요.',
      tone: 'info',
      action: toCreateDocumentAction(feature, C.FEATURE_SEGMENT),
    });
  } else if (!hasDirectChildCategory(segment, C.LAYER, documents, documentsById)) {
    tasks.push({
      id: 'create-excavation-layer',
      icon: 'layers',
      title: '토층 기록',
      detail: `${segment.resource.identifier}의 토층과 중복 관계를 기록하세요.`,
      tone: 'info',
      action: toCreateDocumentAction(segment, C.LAYER),
    });
  }

  const profileParent = segment ?? feature;
  if (!hasDirectChildCategory(profileParent, C.SOIL_PROFILE_PHOTO, documents, documentsById)) {
    tasks.push({
      id: 'create-excavation-profile-photo',
      icon: 'photo-camera',
      title: '토층 사진',
      detail: '토층둑이나 절개면 사진을 조사 기록에 연결하세요.',
      tone: 'info',
      action: toCreateDocumentAction(profileParent, C.SOIL_PROFILE_PHOTO),
    });
  }

  if (!hasDirectChildCategory(feature, C.DRAWING, documents, documentsById)) {
    tasks.push({
      id: 'create-excavation-drawing',
      icon: 'architecture',
      title: '실측 기록',
      detail: '조사 완료 뒤 평면·단면 실측 기록을 유구에 연결하세요.',
      tone: 'info',
      action: toCreateDocumentAction(feature, C.DRAWING),
    });
  }
};

const createTrenchTask = (
  parentDocument: Document,
  title = '트렌치 설정',
  detail = '시굴·발굴 구획을 잡아 유구와 피트 기록의 기준을 만드세요.'
): KoreanFieldworkPriorityTask => ({
  id: 'create-trench',
  icon: 'grid-on',
  title,
  detail,
  tone: 'info',
  action: toCreateDocumentAction(parentDocument, C.TRENCH),
});

const createFeatureTask = (
  parentDocument: Document,
  title = '검출 유구 추가',
  detail = `${parentDocument.resource.identifier} 아래에서 새 유구 기록을 시작하세요.`
): KoreanFieldworkPriorityTask => ({
  id: 'create-detected-feature',
  icon: 'add-location-alt',
  title,
  detail,
  tone: 'info',
  action: toCreateDocumentAction(parentDocument, C.FEATURE),
});

export const getPrimaryOperation = (
  documents: Document[]
): Document | undefined => documents.find((document) =>
  document.resource.category === C.OPERATION
);

export const getFeatureDraftParent = (
  documents: Document[],
  primaryOperation: Document | undefined = getPrimaryOperation(documents),
  investigationModeId?: KoreanFieldworkInvestigationModeId
): Document | undefined => documents.find((document) =>
  document.resource.category === C.TRENCH
) ?? (
  investigationModeId === 'trialTrench'
    ? undefined
    : documents.find((document) =>
      document.resource.category === C.FEATURE_GROUP
    ) ?? primaryOperation
);

const getFirstIssueDocument = (
  summary: KoreanFieldworkTodaySummary,
  documentsById: Map<string, Document>
): Document | undefined => summary.openIssues
  .map((issue) => documentsById.get(issue.documentId))
  .find((document): document is Document => !!document);

const hasCategory = (
  documents: Document[],
  categoryName: string
): boolean => documents.some((document) =>
  document.resource.category === categoryName
);

const toDocumentIndex = (
  documents: Document[]
): Map<string, Document> => new Map(documents.map((document) => [
  document.resource.id,
  document,
]));

const getFirstDocumentByCategory = (
  documents: Document[],
  categoryName: string
): Document | undefined => documents.find((document) =>
  document.resource.category === categoryName
);

const getFirstDirectChildByCategory = (
  parentDocument: Document,
  categoryName: string,
  documents: Document[],
  documentsById: Map<string, Document>
): Document | undefined => documents.find((document) =>
  document.resource.category === categoryName
  && getKoreanFieldworkPrimaryParent(document, documentsById)?.resource.id
    === parentDocument.resource.id
);

const hasDirectChildCategory = (
  parentDocument: Document,
  categoryName: string,
  documents: Document[],
  documentsById: Map<string, Document>
): boolean => !!getFirstDirectChildByCategory(
  parentDocument,
  categoryName,
  documents,
  documentsById
);

const getDailyLogQuickActionDetail = (
  summary: KoreanFieldworkTodaySummary,
  targets: KoreanFieldworkTodayActionTargets,
  currentScopeParent: Document | undefined
): string => {
  if (summary.dailyLogs.length > 0) return '작성 내용 보기';
  if (targets.primaryOperation) return '바로 작성';
  if (currentScopeParent) return '상위 조사구역에서 작성';
  return '조사구역 필요';
};

const getFeatureCandidateQuickActionDetail = (
  summary: KoreanFieldworkTodaySummary,
  targets: KoreanFieldworkTodayActionTargets,
  currentScopeParent: Document | undefined,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): string => {
  if (summary.featureCandidates.length > 0) {
    return `${summary.featureCandidates.length}건 기록`;
  }
  if (investigationModeId === 'trialTrench') {
    if (targets.featureDraftParent) return '트렌치 아래 유구 기록';
    if (targets.primaryOperation) return '트렌치 먼저 추가';
    if (currentScopeParent) return '트렌치 필요';
    return '조사구역 필요';
  }
  if (targets.featureDraftParent) return '유구 추가';
  if (currentScopeParent) return '상위 기록 필요';
  return '조사구역 필요';
};

const getFeatureQuickAction = (
  targets: KoreanFieldworkTodayActionTargets,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkPriorityTaskAction | undefined => {
  if (targets.featureCandidate) {
    return toOpenDocumentAction(targets.featureCandidate);
  }

  if (investigationModeId === 'trialTrench' && !targets.featureDraftParent) {
    return targets.primaryOperation
      ? toCreateDocumentAction(targets.primaryOperation, C.TRENCH)
      : undefined;
  }

  return targets.featureDraftParent
    ? toCreateDocumentAction(targets.featureDraftParent, C.FEATURE)
    : undefined;
};

const getFeatureQuickActionLabel = (
  targets: KoreanFieldworkTodayActionTargets,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): string => {
  if (investigationModeId !== 'trialTrench') return '유구 추가';
  if (targets.featureCandidate) return '유구 기록';
  if (targets.featureDraftParent) return '유구 확인';
  return '트렌치 추가';
};

const getFeatureQuickActionIcon = (
  targets: KoreanFieldworkTodayActionTargets,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkQuickActionIcon =>
  investigationModeId === 'trialTrench'
  && !targets.featureCandidate
  && !targets.featureDraftParent
    ? 'grid-on'
    : 'add-location-alt';

const toOpenDocumentAction = (
  document: Document
): KoreanFieldworkPriorityTaskAction => ({
  type: 'openDocument',
  documentId: document.resource.id,
});

const toCreateDocumentAction = (
  parentDocument: Document,
  categoryName: string
): KoreanFieldworkPriorityTaskAction => ({
  type: 'createDocument',
  parentDocumentId: parentDocument.resource.id,
  categoryName,
});
