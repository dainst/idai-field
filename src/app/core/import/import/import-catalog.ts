import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';


export async function importCatalog(documents: Array<Document>,
                                    datastore: DocumentDatastore,
                                    username: string): Promise<{ errors: string[][], successfulImports: number }> {

    console.log('import catalog', documents);
    return { errors: [], successfulImports: documents.length };
}
