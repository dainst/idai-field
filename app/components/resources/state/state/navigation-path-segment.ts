import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathContext} from './navigation-path-context';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPathSegment extends NavigationPathContext {

    document: IdaiFieldDocument;
}


export module NavigationPathSegment {

    export async function isValid(
        mainTypeDocumentResourceId: string|undefined,
        segment: NavigationPathSegment,
        segments: Array<NavigationPathSegment>,
        hasExisting: (_: string) => Promise<boolean>): Promise<boolean> {

        return await hasExisting(segment.document.resource.id)
            && hasValidRelation(mainTypeDocumentResourceId, segment, segments);
    }


    function hasValidRelation(mainTypeDocumentResourceId: string|undefined, segment: NavigationPathSegment,
                              segments: Array<NavigationPathSegment>): boolean {

        const index: number = segments.indexOf(segment);

        return (index === 0)
            ? mainTypeDocumentResourceId !== undefined && Document.hasRelationTarget(segment.document,
            'isRecordedIn', mainTypeDocumentResourceId)
            : Document.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id);
    }
}


export const isSegmentWith
    = (resourceId: string) => (segment: NavigationPathSegment) => resourceId === segment.document.resource.id;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;


export const differentFrom = (a: NavigationPathSegment) => (b: NavigationPathSegment) =>
    a.document.resource.id !== b.document.resource.id;