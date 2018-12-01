import {Document} from 'idai-components-2'

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {


    /**
     * To determine if importDoc can succeed
     * @param docs
     */
    validateStructurally(docs: Array<Document>): Promise<any[] /* Array<msgWithParams> */>;


    importDoc(doc: Document): Promise<Document|undefined>;
}