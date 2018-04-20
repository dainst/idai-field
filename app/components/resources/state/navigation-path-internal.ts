import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathBase} from './navigation-path';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPathInternal extends NavigationPathBase<NavigationPathSegment> {

    q: string; // top level query string
    types?: string[]; // top level query types
    selected?: IdaiFieldDocument // top level selected document
}


export interface NavigationPathSegment {

    document: IdaiFieldDocument; // nav path document
    q: string;
    types?: Array<string>;
    selected?: IdaiFieldDocument; // selected doc in list
}


export const isSegmentOf
    = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;


export const toDocument = (segment: NavigationPathSegment) => segment.document;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;