import {IdaiFieldDocument} from 'idai-components-2/field';

/**
 * @author Daniel de Oliveira
 */
export interface ViewContext {

    q: string;
    types: string[];
    selected?: IdaiFieldDocument;
}


export module ViewContext {

    export function empty(): ViewContext {

        return {
            q: '',
            types: []
        }
    }
}