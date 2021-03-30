import {to, on} from 'tsfun';
import {differentFrom as differentFromBy} from 'tsfun';
import {Document} from 'idai-field-core';
import {FieldDocument} from 'idai-field-core';
import {ViewContext} from './view-context';


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
            : Document.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id);
    }
}


export const toResourceId = to(['document', 'resource', 'id']);


export const differentFrom = (what: any) => differentFromBy(on(['document','resource','id']), what);
