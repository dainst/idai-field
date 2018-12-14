import {Document} from 'idai-components-2'
import {DocumentDatastore} from '../../datastore/document-datastore';

/**
 * @author Daniel de Oliveira
 */
export type ImportFunction =
    (documents: Array<Document>,
     datastore: DocumentDatastore,
     username: string) =>
        Promise<{ errors: string[][], successfulImports: number }>;
