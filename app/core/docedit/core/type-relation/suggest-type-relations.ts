import {asyncMap} from 'tsfun-extra';
import {FieldDocument, Query} from 'idai-components-2';
import {Name} from '../../../constants';
import {FieldDocumentFindResult} from '../../../datastore/field/field-read-datastore';


/**
 * Suggests and ranks types
 *
 * @param documents
 * @param type: type of the find which we want to declare to be INSTANCE_OF Type.
 * @param find
 *
 * @author Daniel de Oliveira
 */
export async function suggestTypeRelations(documents: Array<FieldDocument>,
                                     type: Name,
                                     find: (query: Query) => Promise<FieldDocumentFindResult>) {


    const rows = asyncMap(async (document: FieldDocument) => {

        const constraints = {constraints: { 'isInstanceOf:contain': document.resource.id }};
        const documents = (await find(constraints)).documents;

        // pairWith
        return [document, documents];

    })(documents);

    // TODO rank them
    return rows;
}