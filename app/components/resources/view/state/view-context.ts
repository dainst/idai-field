import {FieldDocument} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface ViewContext {

    q: string;
    types: string[];
    selected?: FieldDocument;
}


export module ViewContext {

    export function empty(): ViewContext {

        return {
            q: '',
            types: []
        }
    }
}