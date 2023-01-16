import { duplicates, size, to, update } from 'tsfun';
import { RESOURCE_DOT_IDENTIFIER, Document } from 'idai-field-core';
import { ImportErrors as E } from '../import-errors';
import { ImportValidator } from './import-validator';
import { mergeResource } from './merge-resource';


/**
 * @returns clones of the documents with their properties validated and adjusted
 */
export function processDocuments(documents: Array<Document>,
                                 mergeDocs: { [resourceId: string]: Document },
                                 validator: ImportValidator): Array<Document> {

    const mergeMode = size(mergeDocs) > 0;
    if (!mergeMode) assertNoDuplicates(documents);

    const finalDocuments = {};

    for (const document of documents) {

        if (!mergeMode) validator.assertIsKnownCategory(document);

        let finalDocument = document;
        if (mergeMode) {
            const mergeTarget = finalDocuments[document.resource.id] ?? mergeDocs[document.resource.id];
            if (!mergeTarget) throw 'FATAL - in process.ts: no merge target';
            const mergedResource = mergeResource(mergeTarget.resource, document.resource);
            finalDocument = update(Document.RESOURCE, mergedResource, mergeTarget);
        }
        finalDocuments[finalDocument.resource.id] = finalDocument;

        // While we want to leave existing documents' fields as they come from the database,
        // we do test for fields of import document if they are defined.
        // We need to make sure the category is set in any case.
        document.resource.category = finalDocument.resource.category;
        validator.assertFieldsDefined(document);

        if (!mergeMode) validator.assertIsAllowedCategory(finalDocument);

        validator.assertIdentifierPrefixIsValid(finalDocument);
        validator.assertIsWellformed(finalDocument);
    }

    return Object.values(finalDocuments);
}


function assertNoDuplicates(documents: Array<Document>) {

    const dups = duplicates(documents.map(to(RESOURCE_DOT_IDENTIFIER)));
    if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
}
