import {Document} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';


export async function preprocessDocuments(documents: Array<Document>, find: Function, mergeMode: boolean) {

    for (let document of documents) {
        const existingDocument = await find(document.resource.identifier);
        if (mergeMode) {
            if (!existingDocument) throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
            document._id = existingDocument._id;
            document.resource.id = existingDocument.resource.id;
            (document as any)['mergeTarget'] = existingDocument;
        } else if (existingDocument) {
            throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier]; // TODO test
        }
    }
}