import {Document} from 'idai-components-2/core'

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    /**
     */
    go(doc:Document): Promise<any>;
}