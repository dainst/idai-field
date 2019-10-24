import {ImportValidator} from './import-validator';
import {asyncMap} from 'tsfun-extra';
import {ImportErrors as E} from '../import-errors';
import {Document, NewDocument} from 'idai-components-2';
import {DocumentMerge} from './document-merge';
import {Find} from '../types';


/**
 * @returns clones of the documents with their properties adjusted
 */
export function processDocuments(documents: Array<Document>,
                                 validator: ImportValidator,
                                 mergeMode: boolean,
                                 allowOverwriteRelationsInMergeMode: boolean,
                                 find: Find): Promise<Array<Document>> {

    return asyncMap(async (document: Document) => {

        // we want dropdown fields to be complete before merge
        validator.assertDropdownRangeComplete(document.resource);

        const possiblyMergedDocument = await mergeOrUseAsIs(
            document,
            find,
            mergeMode,
            allowOverwriteRelationsInMergeMode);

        return validate(possiblyMergedDocument, validator, mergeMode);
    })(documents);
}


async function mergeOrUseAsIs(document: NewDocument|Document,
                              find: Find,
                              mergeIfExists: boolean,
                              allowOverwriteRelationsOnMerge: boolean): Promise<Document> {

    let documentForUpdate: Document = document as Document;
    const existingDocument = await find(document.resource.identifier);

    if (mergeIfExists) {
        if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate, allowOverwriteRelationsOnMerge);
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
