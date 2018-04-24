import {Document} from 'idai-components-2/core'

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    importDoc(doc: Document): Promise<any>;
}