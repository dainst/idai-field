import {IdaiFieldDocument} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface ViewContext {

    readonly q: string;
    readonly types: string[];
    readonly selected?: IdaiFieldDocument;
}


export module ViewContext {

    export function empty(): ViewContext {

        return {
            q: '',
            types: []
        }
    }
}