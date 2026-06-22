import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

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

export const getKoreanFieldworkTodayActionTargets = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[]
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
    featureDraftParent: getFeatureDraftParent(documents, primaryOperation),
    issueDocument: getFirstIssueDocument(summary, documentsById),
  };
};

export const getKoreanFieldworkPriorityTasks = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[],
  maxTasks = 5
): KoreanFieldworkPriorityTask[] => {
  const targets = getKoreanFieldworkTodayActionTargets(summary, documents);
  const tasks: KoreanFieldworkPriorityTask[] = [];

  if (!targets.primaryOperation && documents.length === 0) {
    tasks.push({
      id: 'start-operation',
      icon: 'map',
      title: '조사구역부터 만들기',
      detail: '지도 야장에서 현장 조사구역을 먼저 잡아야 기록 흐름이 이어집니다.',
      tone: 'warning',
      action: { type: 'openMap' },
    });

    return tasks;
  }

  if (targets.primaryOperation) {
    if (!targets.dailyLog) {
      tasks.push({
        id: 'create-daily-log',
        icon: 'event-note',
        title: '오늘 작업일지 작성',
        detail: `${targets.primaryOperation.resource.identifier}의 작업 범위와 판단을 남기세요.`,
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

    if (!hasCategory(documents, C.TRENCH)) {
      tasks.push({
        id: 'create-trench',
        icon: 'grid-on',
        title: '트렌치/조사갱 설정',
        detail: '시굴·발굴 구획을 잡아 유구와 피트 기록의 기준을 만드세요.',
        tone: 'info',
        action: {
          type: 'createDocument',
          parentDocumentId: targets.primaryOperation.resource.id,
          categoryName: C.TRENCH,
        },
      });
    }
  }

  if (!targets.featureCandidate && targets.featureDraftParent) {
    tasks.push({
      id: 'create-feature-candidate',
      icon: 'add-location-alt',
      title: '유구 후보 추가',
      detail: `${targets.featureDraftParent.resource.identifier} 아래에서 새 유구 후보를 시작하세요.`,
      tone: 'info',
      action: {
        type: 'createDocument',
        parentDocumentId: targets.featureDraftParent.resource.id,
        categoryName: C.FEATURE,
      },
    });
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

export const getPrimaryOperation = (
  documents: Document[]
): Document | undefined => documents.find((document) =>
  document.resource.category === C.OPERATION
);

export const getFeatureDraftParent = (
  documents: Document[],
  primaryOperation: Document | undefined = getPrimaryOperation(documents)
): Document | undefined => documents.find((document) =>
  document.resource.category === C.TRENCH
) ?? documents.find((document) =>
  document.resource.category === C.FEATURE_GROUP
) ?? primaryOperation;

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
