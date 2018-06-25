import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathBase} from './navigation-path';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPathInternal extends NavigationPathBase<NavigationPathSegment> {

    qWithHierarchy: string;
    qWithoutHierarchy: string;
    typesWithHierarchy: string[];
    typesWithoutHierarchy: string[];
    selected?: IdaiFieldDocument; // TODO separate with/without hierarchy
}


export interface NavigationPathSegment {

    document: IdaiFieldDocument; // nav path document
    q: string;
    types: Array<string>;
    selected?: IdaiFieldDocument; // selected doc in list
}


export const isSegmentOf
    = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;


export const toDocument = (segment: NavigationPathSegment) => segment.document;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;