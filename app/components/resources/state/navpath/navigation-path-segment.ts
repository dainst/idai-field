import {NavigationPathContext} from './navigation-path-context';

import {IdaiFieldDocument} from 'idai-components-2/field';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPathSegment extends NavigationPathContext {

    document: IdaiFieldDocument; // nav path document
}


export const isSegmentOf
    = (resourceId: string) => (segment: NavigationPathSegment) => resourceId === segment.document.resource.id;


export const toDocument = (segment: NavigationPathSegment) => segment.document;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;