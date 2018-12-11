import {Document} from 'idai-components-2'
import {ImportReport} from './import-facade';

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    import(documents: Array<Document>, importReport: ImportReport, username: string): Promise<ImportReport>;
}