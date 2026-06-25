import { Document } from 'idai-field-core';

const LEGACY_OPERATION_ROOT_EXCLUDED_CATEGORIES = new Set<string>([
    'Operation',
    'AerialMapLayer',
    'Place',
    'Project',
    'SourceEvidenceIndex'
]);

const LEGACY_OPERATION_ROOT_CATEGORIES = new Set<string>([
    'DailyLog',
    'Drawing',
    'Feature',
    'FeatureGroup',
    'FeatureSegment',
    'FieldRecordQualityReview',
    'Find',
    'FindCollection',
    'Layer',
    'PenMemo',
    'Photo',
    'Sample',
    'SoilProfilePhoto',
    'Survey',
    'SurveyBoundary',
    'Trench'
]);

const DIRECT_PARENT_RELATIONS = [
    'liesWithin',
    'isRecordedInFeature',
    'depicts',
    'isDepictedIn',
    'isMapLayerOf',
    'isRecordedIn'
];

export const OPERATION_WRAP_CONFIRMATION_TITLE = '조사 경계 생성';


export function getOperationWrapConfirmationMessage(legacyRootDocumentCount: number): string {

    return `${legacyRootDocumentCount}개 기존 기록의 내용은 유지합니다. `
        + '조사 경계를 만들고 이후 기록을 그 기준 아래에 이어서 남깁니다.';
}


export function getLegacyRootDocumentsForOperation(documents: Document[]): Document[] {

    const documentsById = new Map(documents.map(document => [document.resource.id, document]));

    return documents.filter(document =>
        isLegacyOperationRootCategory(document.resource.category)
        && !getPrimaryParent(document, documentsById)
    );
}


export function createOperationRelationUpdate(document: Document,
                                              operationDocument: Document): Document {

    return {
        ...document,
        resource: {
            ...document.resource,
            relations: {
                ...(document.resource.relations ?? {}),
                isRecordedIn: [operationDocument.resource.id]
            }
        }
    };
}


function isLegacyOperationRootCategory(categoryName: string): boolean {

    return LEGACY_OPERATION_ROOT_CATEGORIES.has(categoryName)
        && !LEGACY_OPERATION_ROOT_EXCLUDED_CATEGORIES.has(categoryName);
}


function getPrimaryParent(document: Document,
                          documentsById: Map<string, Document>): Document|undefined {

    const relations = document.resource.relations ?? {};

    for (const relationName of DIRECT_PARENT_RELATIONS) {
        const targets = relations[relationName];
        const parentId = Array.isArray(targets)
            ? targets.find(target => documentsById.has(target) && target !== document.resource.id)
            : undefined;
        if (parentId) return documentsById.get(parentId);
    }

    return undefined;
}
