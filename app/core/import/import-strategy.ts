import {Document} from 'idai-components-2'
import {ImportReport} from './import';

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    import(docsToUpdate: Array<Document>, importReport: ImportReport): Promise<ImportReport>;
}