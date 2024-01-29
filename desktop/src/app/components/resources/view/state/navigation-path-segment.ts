import { to } from 'tsfun';
import { Document, Resource, FieldDocument } from 'idai-field-core';
import { ViewContext } from './view-context';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPathSegment extends ViewContext {

    readonly document: FieldDocument;
}


export module NavigationPathSegment {

    export function isValid(operationId: string|undefined, segment: NavigationPathSegment,
                            segments: Array<NavigationPathSegment>,
                            exists: (_: string) => boolean): boolean {

        return exists(segment.document.resource.id)
            && hasValidRelation(operationId, segment, segments);
    }


    function hasValidRelation(operationId: string|undefined, segment: NavigationPathSegment,
                            segments: Array<NavigationPathSegment>): boolean {

        const index = segments.indexOf(segment);

        return index === 0
            ? operationId !== undefined
                && (Document.hasRelationTarget(segment.document, 'isRecordedIn', operationId)
                    || ['Place', 'TypeCatalog'].includes(segment.document.resource.category))
            : (Document.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id)
                || Document.hasRelationTarget(segment.document,
                'isPresentIn', segments[index - 1].document.resource.id));
    }
}


export const toResourceId = to(['document', Document.RESOURCE, Resource.ID]);


export const differentFrom = (a: any) => (b: any) => a.document.resource.id !== b.document.resource.id;
