import {Document} from 'idai-components-2'
import {ImportReport} from '../import-facade';
import {DocumentDatastore} from '../../datastore/document-datastore';

/**
 * @author Daniel de Oliveira
 */
export interface ImportStrategy {

    import(documents: Array<Document>,
           importReport: ImportReport,
           datastore: DocumentDatastore,
           username: string): Promise<ImportReport>;
}