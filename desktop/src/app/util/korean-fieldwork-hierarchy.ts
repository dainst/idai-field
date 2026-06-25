import { Document } from 'idai-field-core';


export interface KoreanFieldworkHierarchyItem {
    documentId: string;
    identifier: string;
    parentIdentifier?: string;
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

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
    Operation: '조사 구역 기록',
    Trench: '트렌치',
    Feature: '유구',
    FeatureSegment: '세부 단위',
    Layer: '토층'
};

const HIERARCHY_CATEGORIES: readonly string[] = [
    'Operation',
    'Trench',
    'Feature',
    'FeatureSegment',
    'Layer'
];

const HIERARCHY_CATEGORY_SET = new Set(HIERARCHY_CATEGORIES);
const MAX_SCOPE_DEPTH = 8;

const DIRECT_PARENT_RELATIONS: readonly string[] = [
    'liesWithin',
    'isRecordedInFeature',
    'depicts',
    'isDepictedIn',
    'isMapLayerOf',
    'isRecordedIn'
];


export function makeKoreanFieldworkHierarchyLanes(
        documents: Document[],
        issueCountByDocumentId: { [documentId: string]: number } = {},
        scopeParent?: Document,
        maxItemsPerLane = 4
): KoreanFieldworkHierarchyLane[] {

    const documentsById = new Map(documents.map(document => [document.resource.id, document]));
    const childrenByParentId = getChildrenByParentId(documents, documentsById);
    const scopedDocuments = documents.filter(document =>
        HIERARCHY_CATEGORY_SET.has(document.resource.category)
        && (
            isDocumentInScope(document, scopeParent, documentsById)
            || isDocumentAncestorOfScope(document, scopeParent, documentsById)
        )
    );

    return HIERARCHY_CATEGORIES.map(categoryName => {
        const laneDocuments = scopedDocuments
            .filter(document => document.resource.category === categoryName)
            .sort((documentA, documentB) => compareHierarchyDocuments(documentA, documentB, scopeParent));
        const items = laneDocuments
            .slice(0, maxItemsPerLane)
            .map(document => toHierarchyItem(
                document,
                documentsById,
                childrenByParentId,
                issueCountByDocumentId,
                scopeParent
            ));

        return {
            categoryName,
            label: CATEGORY_LABELS[categoryName] ?? categoryName,
            totalCount: laneDocuments.length,
            hiddenCount: Math.max(0, laneDocuments.length - items.length),
            items
        };
    });
}


export function isKoreanFieldworkHierarchyScopeDocument(document: Document|undefined): boolean {

    return !!document?.resource?.category && HIERARCHY_CATEGORY_SET.has(document.resource.category);
}


function getChildrenByParentId(documents: Document[],
                               documentsById: Map<string, Document>): Map<string, Document[]> {

    const childrenByParentId = new Map<string, Document[]>();

    documents.forEach(document => {
        const parent = getPrimaryParent(document, documentsById);
        if (!parent) return;

        const children = childrenByParentId.get(parent.resource.id) ?? [];
        children.push(document);
        childrenByParentId.set(parent.resource.id, children);
    });

    return childrenByParentId;
}


function toHierarchyItem(document: Document,
                         documentsById: Map<string, Document>,
                         childrenByParentId: Map<string, Document[]>,
                         issueCountByDocumentId: { [documentId: string]: number },
                         scopeParent?: Document): KoreanFieldworkHierarchyItem {

    const parent = getPrimaryParent(document, documentsById);

    return {
        documentId: document.resource.id,
        identifier: document.resource.identifier ?? document.resource.id,
        parentIdentifier: parent?.resource.identifier ?? parent?.resource.id,
        childCount: (childrenByParentId.get(document.resource.id) ?? [])
            .filter(childDocument => HIERARCHY_CATEGORY_SET.has(childDocument.resource.category))
            .length,
        issueCount: issueCountByDocumentId[document.resource.id] ?? 0,
        isCurrentScope: document.resource.id === scopeParent?.resource.id
    };
}


function isDocumentInScope(document: Document,
                           scopeParent: Document|undefined,
                           documentsById: Map<string, Document>): boolean {

    if (!scopeParent) return true;
    if (document.resource.id === scopeParent.resource.id) return true;

    let currentDocument = document;
    const visitedIds = new Set<string>([document.resource.id]);

    for (let depth = 0; depth < MAX_SCOPE_DEPTH; depth++) {
        if (hasDirectParentId(currentDocument, scopeParent.resource.id)) return true;

        const parent = getPrimaryParent(currentDocument, documentsById);
        if (!parent || visitedIds.has(parent.resource.id)) return false;
        if (parent.resource.id === scopeParent.resource.id) return true;

        visitedIds.add(parent.resource.id);
        currentDocument = parent;
    }

    return false;
}


function isDocumentAncestorOfScope(document: Document,
                                   scopeParent: Document|undefined,
                                   documentsById: Map<string, Document>): boolean {

    if (!scopeParent || document.resource.id === scopeParent.resource.id) return false;

    let currentDocument = scopeParent;
    const visitedIds = new Set<string>([scopeParent.resource.id]);

    for (let depth = 0; depth < MAX_SCOPE_DEPTH; depth++) {
        const parent = getPrimaryParent(currentDocument, documentsById);
        if (!parent || visitedIds.has(parent.resource.id)) return false;
        if (parent.resource.id === document.resource.id) return true;

        visitedIds.add(parent.resource.id);
        currentDocument = parent;
    }

    return false;
}


function getPrimaryParent(document: Document, documentsById: Map<string, Document>): Document|undefined {

    const relations = document.resource.relations ?? {};

    for (const relationName of DIRECT_PARENT_RELATIONS) {
        const parent = getFirstExistingDocument(
            relations[relationName],
            documentsById,
            document.resource.id
        );
        if (parent) return parent;
    }

    return undefined;
}


function getFirstExistingDocument(relationTargets: unknown,
                                  documentsById: Map<string, Document>,
                                  currentDocumentId: string): Document|undefined {

    if (!Array.isArray(relationTargets)) return undefined;

    const parentId = relationTargets.find(targetId =>
        typeof targetId === 'string'
        && targetId !== currentDocumentId
        && documentsById.has(targetId)
    );

    return parentId ? documentsById.get(parentId) : undefined;
}


function hasDirectParentId(document: Document, parentDocumentId: string): boolean {

    const relations = document.resource.relations ?? {};

    return DIRECT_PARENT_RELATIONS.some(relationName => {
        const relationTargets = relations[relationName];

        return Array.isArray(relationTargets) && relationTargets.includes(parentDocumentId);
    });
}


function compareHierarchyDocuments(documentA: Document,
                                   documentB: Document,
                                   scopeParent: Document|undefined): number {

    const scopeDiff = Number(documentB.resource.id === scopeParent?.resource.id)
        - Number(documentA.resource.id === scopeParent?.resource.id);
    if (scopeDiff !== 0) return scopeDiff;

    return getDocumentSortKey(documentA).localeCompare(getDocumentSortKey(documentB));
}


function getDocumentSortKey(document: Document): string {

    return document.resource.identifier ?? document.resource.id;
}
