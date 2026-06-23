import { Document } from 'idai-field-core';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import { getKoreanFieldworkPrimaryParent } from './korean-fieldwork-record-summary';
import {
  isKoreanFieldworkDocumentAncestorOfScope,
  isKoreanFieldworkDocumentInScope,
} from './korean-fieldwork-scope';

export interface KoreanFieldworkHierarchyItem {
  document: Document;
  parentIdentifier: string | undefined;
  childCount: number;
  issueCount: number;
  isCurrentScope: boolean;
}

export interface KoreanFieldworkHierarchyLane {
  categoryName: string;
  label: string;
  totalCount: number;
  hiddenCount: number;
  items: KoreanFieldworkHierarchyItem[];
}

const C = KOREAN_FIELDWORK_CATEGORIES;

export const KOREAN_FIELDWORK_HIERARCHY_CATEGORIES = [
  C.OPERATION,
  C.TRENCH,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
];

const HIERARCHY_CATEGORY_SET = new Set<string>(KOREAN_FIELDWORK_HIERARCHY_CATEGORIES);

export const getKoreanFieldworkHierarchyLanes = (
  documents: Document[],
  documentsById: Map<string, Document>,
  scopeParent: Document | undefined,
  issueCountByDocumentId: Record<string, number> = {},
  maxItemsPerLane = 4
): KoreanFieldworkHierarchyLane[] => {
  const childrenByParentId = getChildrenByParentId(documents, documentsById);
  const scopedDocuments = documents
    .filter((document) =>
      HIERARCHY_CATEGORY_SET.has(document.resource.category)
      && (
        isKoreanFieldworkDocumentInScope(document, scopeParent, documentsById)
        || isKoreanFieldworkDocumentAncestorOfScope(
          document,
          scopeParent,
          documentsById
        )
      )
    );

  return KOREAN_FIELDWORK_HIERARCHY_CATEGORIES.map((categoryName) => {
    const laneDocuments = scopedDocuments
      .filter((document) => document.resource.category === categoryName)
      .sort((documentA, documentB) =>
        compareHierarchyDocuments(documentA, documentB, scopeParent)
      );
    const items = laneDocuments.slice(0, maxItemsPerLane)
      .map((document) => toHierarchyItem(
        document,
        documentsById,
        childrenByParentId,
        scopeParent,
        issueCountByDocumentId
      ));

    return {
      categoryName,
      label: getKoreanFieldworkCategoryLabel(categoryName),
      totalCount: laneDocuments.length,
      hiddenCount: Math.max(0, laneDocuments.length - items.length),
      items,
    };
  });
};

const getChildrenByParentId = (
  documents: Document[],
  documentsById: Map<string, Document>
): Map<string, Document[]> => {
  const childrenByParentId = new Map<string, Document[]>();

  documents.forEach((document) => {
    const parent = getKoreanFieldworkPrimaryParent(document, documentsById);
    if (!parent) return;

    const children = childrenByParentId.get(parent.resource.id) ?? [];
    children.push(document);
    childrenByParentId.set(parent.resource.id, children);
  });

  return childrenByParentId;
};

const toHierarchyItem = (
  document: Document,
  documentsById: Map<string, Document>,
  childrenByParentId: Map<string, Document[]>,
  scopeParent: Document | undefined,
  issueCountByDocumentId: Record<string, number>
): KoreanFieldworkHierarchyItem => {
  const parent = getKoreanFieldworkPrimaryParent(document, documentsById);

  return {
    document,
    parentIdentifier: parent?.resource.identifier ?? parent?.resource.id,
    childCount: (childrenByParentId.get(document.resource.id) ?? [])
      .filter((childDocument) =>
        HIERARCHY_CATEGORY_SET.has(childDocument.resource.category)
      ).length,
    issueCount: issueCountByDocumentId[document.resource.id] ?? 0,
    isCurrentScope: document.resource.id === scopeParent?.resource.id,
  };
};

const compareHierarchyDocuments = (
  documentA: Document,
  documentB: Document,
  scopeParent: Document | undefined
): number => {
  const scopeDiff = Number(documentB.resource.id === scopeParent?.resource.id)
    - Number(documentA.resource.id === scopeParent?.resource.id);
  if (scopeDiff !== 0) return scopeDiff;

  return getDocumentSortKey(documentA).localeCompare(getDocumentSortKey(documentB));
};

const getDocumentSortKey = (document: Document): string =>
  document.resource.identifier || document.resource.id;
