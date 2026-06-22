import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

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
