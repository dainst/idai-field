import { Document } from 'idai-field-core';
import { getKoreanFieldworkPrimaryParent } from './korean-fieldwork-record-summary';

interface KoreanFieldworkScopeOptions {
  includeAncestors?: boolean;
}

const MAX_SCOPE_DEPTH = 8;
const DIRECT_SCOPE_PARENT_RELATIONS = [
  'liesWithin',
  'isRecordedInFeature',
  'depicts',
  'isDepictedIn',
  'isMapLayerOf',
  'isRecordedIn',
];

export const getKoreanFieldworkScopedDocuments = (
  documents: Document[],
  scopeParent: Document | undefined,
  documentsById: Map<string, Document> = new Map(documents.map((document) => [
    document.resource.id,
    document,
  ])),
  options: KoreanFieldworkScopeOptions = {}
): Document[] => {
  if (!scopeParent) return documents;

  return documents.filter((document) =>
    isKoreanFieldworkDocumentInScope(document, scopeParent, documentsById)
    || (
      !!options.includeAncestors
      && isKoreanFieldworkDocumentAncestorOfScope(
        document,
        scopeParent,
        documentsById
      )
    )
  );
};

export const isKoreanFieldworkDocumentInScope = (
  document: Document,
  scopeParent: Document | undefined,
  documentsById: Map<string, Document>
): boolean => {
  if (!scopeParent) return true;
  if (document.resource.id === scopeParent.resource.id) return true;

  let currentDocument = document;
  const visitedIds = new Set<string>([document.resource.id]);

  for (let depth = 0; depth < MAX_SCOPE_DEPTH; depth += 1) {
    if (hasDirectScopeParentId(currentDocument, scopeParent.resource.id)) {
      return true;
    }

    const parent = getKoreanFieldworkPrimaryParent(currentDocument, documentsById);
    if (!parent || visitedIds.has(parent.resource.id)) return false;
    if (parent.resource.id === scopeParent.resource.id) return true;

    visitedIds.add(parent.resource.id);
    currentDocument = parent;
  }

  return false;
};

export const isKoreanFieldworkDocumentAncestorOfScope = (
  document: Document,
  scopeParent: Document | undefined,
  documentsById: Map<string, Document>
): boolean => {
  if (!scopeParent || document.resource.id === scopeParent.resource.id) {
    return false;
  }

  let currentDocument = scopeParent;
  const visitedIds = new Set<string>([scopeParent.resource.id]);

  for (let depth = 0; depth < MAX_SCOPE_DEPTH; depth += 1) {
    const parent = getKoreanFieldworkPrimaryParent(currentDocument, documentsById);
    if (!parent || visitedIds.has(parent.resource.id)) return false;
    if (parent.resource.id === document.resource.id) return true;

    visitedIds.add(parent.resource.id);
    currentDocument = parent;
  }

  return false;
};

const hasDirectScopeParentId = (
  document: Document,
  scopeParentId: string
): boolean => {
  const relations = document.resource.relations ?? {};

  return DIRECT_SCOPE_PARENT_RELATIONS.some((relationName) => {
    const relationTargets = relations[relationName];
    return Array.isArray(relationTargets)
      && relationTargets.includes(scopeParentId);
  });
};
