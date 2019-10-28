import {ImportValidator} from './import-validator';
import {Document, NewDocument} from 'idai-components-2';
import {ImportOptions} from '../default-import';
import {mergeDocument} from './merge-document';


/**
 * @returns clones of the documents with their properties adjusted
 */
export function processDocuments(documents: Array<Document>,
                                 validator: ImportValidator,
                                 importOptions: ImportOptions): Array<Document> {

    return documents.map((document: Document) => {

        // we want dropdown fields to be complete before merge
        validator.assertDropdownRangeComplete(document.resource);

        const possiblyMergedDocument = mergeOrUseAsIs(document, importOptions);
        return validate(possiblyMergedDocument, validator, importOptions.mergeMode === true);
    });
}


function mergeOrUseAsIs(document: NewDocument|Document,
                              {mergeMode, allowOverwriteRelationsInMergeMode}: ImportOptions): Document {

    let documentForUpdate: Document = document as Document;

    if (mergeMode === true) {
        documentForUpdate =
            mergeDocument(
                (documentForUpdate as any)['mergeTarget'],
                documentForUpdate,
                allowOverwriteRelationsInMergeMode === true);
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
