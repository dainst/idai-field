import { FieldDocument } from 'idai-field-core';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface ViewContext {

    q: string;
    categories: string[];
    selected?: FieldDocument;
}


export module ViewContext {

    export function empty(): ViewContext {

        return {
            q: '',
            categories: []
        }
    }
}
