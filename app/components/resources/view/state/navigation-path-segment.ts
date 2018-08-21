import {Document} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {ViewContext} from './view-context';
import {to, differentFromBy, on} from 'tsfun';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPathSegment extends ViewContext {

    readonly document: IdaiFieldDocument;
}


export module NavigationPathSegment {

    export async function isValid(
        mainTypeDocumentResourceId: string|undefined,
        segment: NavigationPathSegment,
        segments: Array<NavigationPathSegment>,
        exists: (_: string) => Promise<boolean>): Promise<boolean> {

        return await exists(segment.document.resource.id)
            && hasValidRelation(mainTypeDocumentResourceId, segment, segments);
    }


    function hasValidRelation(mainTypeDocumentResourceId: string|undefined, segment: NavigationPathSegment,
                              segments: Array<NavigationPathSegment>): boolean {

        const index = segments.indexOf(segment);

        return index === 0
            ? mainTypeDocumentResourceId !== undefined && Document.hasRelationTarget(segment.document,
            'isRecordedIn', mainTypeDocumentResourceId)
            : Document.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id);
    }
}


export const toResourceId = to('document.resource.id');


export const differentFrom = differentFromBy(on('document.resource.id'));