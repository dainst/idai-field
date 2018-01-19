import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPathInternal {

    elements: Array<NavigationPathSegment>; // contains elements starting with an operation type document containing segment
    rootDocument?: IdaiFieldDocument;
    q?: string; // top level query string
    types?: string[]; // top level query types
}


export interface NavigationPathSegment {

    document: IdaiFieldDocument;
    q?: string;
    types?: Array<string>;
}


export class NavigationPathInternal {

    public static empty() {

        return {
            elements: []
        }
    }
}