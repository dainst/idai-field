import {
  Document,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import {
  getKoreanFieldworkIssueResolutionAction,
  KoreanFieldworkIssueResolutionAction,
} from './korean-fieldwork-issue-resolution';

export interface KoreanFieldworkCloseoutIssueAction {
  issue: KoreanFieldworkReadinessIssue;
  document?: Document;
  resolutionAction?: KoreanFieldworkIssueResolutionAction;
}

export interface KoreanFieldworkCloseoutBatchUpdate {
  document: Document;
  updates: Record<string, unknown>;
  issueCount: number;
}

export const getKoreanFieldworkCloseoutIssueActions = (
  issues: KoreanFieldworkReadinessIssue[],
  documentsById: Map<string, Document>,
  getAllowedAddCategoryNames: (document: Document) => string[]
): KoreanFieldworkCloseoutIssueAction[] => issues.map((issue) => {
  const document = documentsById.get(issue.documentId);
  const resolutionAction = document
    ? getKoreanFieldworkIssueResolutionAction(
      issue,
      document,
      getAllowedAddCategoryNames(document)
    )
    : undefined;

  return {
    issue,
    document,
    resolutionAction,
  };
});

export const getKoreanFieldworkCloseoutBatchUpdates = (
  issueActions: KoreanFieldworkCloseoutIssueAction[]
): KoreanFieldworkCloseoutBatchUpdate[] => {
  const updatesByDocumentId = new Map<string, KoreanFieldworkCloseoutBatchUpdate>();

  issueActions.forEach(({ document, resolutionAction }) => {
    if (
      !document
      || resolutionAction?.type !== 'updateFields'
      || !resolutionAction.updates
    ) {
      return;
    }

    const existingUpdate = updatesByDocumentId.get(document.resource.id);
    if (existingUpdate) {
      updatesByDocumentId.set(document.resource.id, {
        ...existingUpdate,
        updates: mergeUpdates(existingUpdate.updates, resolutionAction.updates),
        issueCount: existingUpdate.issueCount + 1,
      });
      return;
    }

    updatesByDocumentId.set(document.resource.id, {
      document,
      updates: resolutionAction.updates,
      issueCount: 1,
    });
  });

  return Array.from(updatesByDocumentId.values());
};

const mergeUpdates = (
  updateA: Record<string, unknown>,
  updateB: Record<string, unknown>
): Record<string, unknown> => Object.keys(updateB).reduce((merged, key) => ({
  ...merged,
  [key]: mergeUpdateValue(merged[key], updateB[key]),
}), { ...updateA });

const mergeUpdateValue = (
  valueA: unknown,
  valueB: unknown
): unknown => {
  if (Array.isArray(valueA) && Array.isArray(valueB)) {
    return [...valueA, ...valueB].filter((value, index, values) =>
      values.indexOf(value) === index
    );
  }

  return valueB;
};
