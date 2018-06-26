import {NavigationPathContext} from './navigation-path-context';

import {IdaiFieldDocument} from 'idai-components-2/field';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPathSegment extends NavigationPathContext {

    document: IdaiFieldDocument;
}


export const isSegmentWith
    = (resourceId: string) => (segment: NavigationPathSegment) => resourceId === segment.document.resource.id;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;


export const differentFrom = (a: NavigationPathSegment) => (b: NavigationPathSegment) =>
    a.document.resource.id !== b.document.resource.id;