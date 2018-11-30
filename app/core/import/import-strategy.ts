import {Document} from 'idai-components-2'

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    validateStructurally(docs: Array<Document>): Promise<any[] /* Array<msgWithParams> */>;


    importDoc(doc: Document): Promise<Document|undefined>;
}