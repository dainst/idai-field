import { Document } from 'idai-field-core';
import {
  KOREAN_FIELDWORK_CATEGORIES,
  KOREAN_FIELDWORK_CATEGORY_ORDER,
} from './korean-fieldwork-categories';
import { getKoreanFieldworkPrimaryParent } from './korean-fieldwork-record-summary';

const LEGACY_OPERATION_ROOT_EXCLUDED_CATEGORIES = new Set<string>([
  KOREAN_FIELDWORK_CATEGORIES.OPERATION,
  KOREAN_FIELDWORK_CATEGORIES.AERIAL_MAP_LAYER,
  KOREAN_FIELDWORK_CATEGORIES.PLACE,
  KOREAN_FIELDWORK_CATEGORIES.SOURCE_EVIDENCE_INDEX,
]);

const LEGACY_OPERATION_ROOT_CATEGORIES = new Set<string>(
  KOREAN_FIELDWORK_CATEGORY_ORDER.filter((categoryName) =>
    !LEGACY_OPERATION_ROOT_EXCLUDED_CATEGORIES.has(categoryName))
);

export const OPERATION_WRAP_CONFIRMATION_TITLE = '조사 경계 생성';

export const getOperationWrapConfirmationMessage = (
  legacyRootDocumentCount: number
): string =>
  `${legacyRootDocumentCount}개 기존 기록의 내용은 유지합니다. 조사 경계를 만들고 이후 기록을 그 기준 아래에 이어서 남깁니다.`;

export const getLegacyRootDocumentsForOperation = (
  documents: Document[]
): Document[] => {
  const documentsById = new Map(documents.map((document) => [
    document.resource.id,
    document,
  ]));

  return documents.filter((document) =>
    LEGACY_OPERATION_ROOT_CATEGORIES.has(document.resource.category)
    && !getKoreanFieldworkPrimaryParent(document, documentsById)
  );
};

export const createOperationRelationUpdate = (
  document: Document,
  operationDoc: Document
): Document => ({
  ...document,
  resource: {
    ...document.resource,
    relations: {
      ...(document.resource.relations ?? {}),
      isRecordedIn: [operationDoc.resource.id],
    },
  },
});
