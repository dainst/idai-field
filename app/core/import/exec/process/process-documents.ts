import {ImportValidator} from './import-validator';
import {asyncMap} from 'tsfun-extra';
import {ImportErrors as E} from '../import-errors';
import {Document, NewDocument} from 'idai-components-2';
import {DocumentMerge} from './document-merge';
import {Find} from '../types';
import {ImportOptions} from '../default-import';


/**
 * @returns clones of the documents with their properties adjusted
 */
export function processDocuments(documents: Array<Document>,
                                 validator: ImportValidator,
                                 find: Find,
                                 importOptions: ImportOptions): Promise<Array<Document>> {

    return asyncMap(async (document: Document) => {

        // we want dropdown fields to be complete before merge
        validator.assertDropdownRangeComplete(document.resource);

        const possiblyMergedDocument = await mergeOrUseAsIs(document, find, importOptions);
        return validate(possiblyMergedDocument, validator, !!importOptions.mergeMode);
    })(documents);
}


async function mergeOrUseAsIs(document: NewDocument|Document,
                              find: Find,
                              {mergeMode, allowOverwriteRelationsInMergeMode}: ImportOptions): Promise<Document> {

    let documentForUpdate: Document = document as Document;
    const existingDocument = await find(document.resource.identifier);

    if (!!mergeMode) {
        if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate, !!allowOverwriteRelationsInMergeMode);
        else throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
    } else {
        if (existingDocument) throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
    }
    return documentForUpdate;
}


function validate(document: Document, validator: ImportValidator, mergeMode: boolean): Document {

    if (!mergeMode) {
        validator.assertIsKnownType(document);
        validator.assertIsAllowedType(document, mergeMode);
    }
    validator.assertIsWellformed(document);
    return document;
}
