import {Document} from 'idai-components-2'

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    importDoc(doc: Document): Promise<Document>;
}