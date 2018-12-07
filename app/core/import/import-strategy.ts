import {Document} from 'idai-components-2'
import {ImportReport} from './import';

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    import(documents: Array<Document>, importReport: ImportReport): Promise<ImportReport>;
}