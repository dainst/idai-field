import {identity, Map, Pair, Either} from 'tsfun';
import {Document} from 'idai-components-2';
import {ImportValidator} from './process/import-validator';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Find} from './types';
import {assertLegalCombination, findByIdentifier} from './utils';
import {complementInverseRelationsBetweenImportDocs, makeSureRelationStructuresExists, preprocessRelations} from './preprocess-relations';
import {preprocessFields} from './preprocess-fields';
import {ImportErrors as E} from './import-errors';
import {HierarchicalRelations, PARENT} from '../../model/relation-constants';
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {InverseRelationsMap} from '../../configuration/inverse-relations-map';
import {processDocuments} from './process/process-documents';
import {processRelations} from './process/process-relations';
import {Settings} from '../../settings/settings';


export interface ImportOptions {

    mergeMode?: boolean;
    permitDeletions?: boolean;
    operationId?: string;
    useIdentifiersInRelations?: boolean;
    differentialImport?: true;
}


export interface ImportHelpers {

    generateId: () => string;
    preprocessDocument: (_: Document) => Document;
    postprocessDocument: (_: Document) => Document;
}


export interface ImportServices {

    validator: ImportValidator,
    datastore: DocumentDatastore
}


export interface ImportContext {

    operationCategoryNames: string[];
    inverseRelationsMap: InverseRelationsMap;
    settings: Settings;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildImportDocuments(services: ImportServices,
                                     context: ImportContext,
                                     helpers: ImportHelpers,
                                     options: ImportOptions = {}) {

    // TODO assert that useIdentifiersInRelations is called with differentialImport
    assertLegalCombination(options);
    if (options.mergeMode) options.useIdentifiersInRelations = true; // TODO temporary
    
    const get  = (resourceId: string) => services.datastore.get(resourceId);
    const find = findByIdentifier(services.datastore);

    /**
     * @param documents documents with the field resource.identifier set to a non empty string.
     *   If resource.id is set, it will be taken as document.id on creation.
     *   The relations map is assumed to be at least existent, but can be empty. // TODO REVIEW, than we can omit creation of it and only assert that it is there
     *   The resource.category field may be empty.
     */
    return async function importDocuments(documents: Array<Document>)
        : Promise< Either<Array<Array<string>>, [Array<Document>, Array<Document>, Array<Document>] >> {

        let processedDocuments: any = undefined;
        let targetDocuments;
        let documentsForImport;

        makeSureRelationStructuresExists(documents);
        complementInverseRelationsBetweenImportDocs(context, options, documents); // TODO now that we have that here, we could simplify later steps probably
        
        try {
            const existingDocuments = await makeExistingDocumentsMap(find, options, documents);
            const docs = filterOnDifferentialImport(existingDocuments, options, documents);
            preprocessFields(docs, options);
            await preprocessRelations(existingDocuments, docs, helpers, get, options);
            const mergeDocs = preprocessDocuments(existingDocuments, helpers, options, docs);
            processedDocuments = processDocuments(docs, mergeDocs, services.validator);
            targetDocuments = await processRelations(
                processedDocuments,
                services.validator,
                context.operationCategoryNames,
                get,
                context.inverseRelationsMap,
                options
            );
            documentsForImport = processedDocuments.map(helpers.postprocessDocument ?? identity);
            return options.mergeMode === true 
                ? [undefined, [[], documentsForImport, targetDocuments]]
                : [undefined, [documentsForImport, [], targetDocuments]];

        } catch (msgWithParams) {
            // if (msgWithParams[0] === E.TARGET_CATEGORY_RANGE_MISMATCH
            //     && ([LIES_WITHIN, RECORDED_IN].includes(msgWithParams[2]))) msgWithParams[2] = PARENT;
            // return { errors: [msgWithParams], successfulImports: 0 };
            return [[msgWithParams], undefined];
        }
    }
}


async function makeExistingDocumentsMap(find: Find,
                                        options: ImportOptions,
                                        documents: Array<Document>): Promise<Map<Document>> {

    if (!options.useIdentifiersInRelations) return {};
    const lookup = {};
    for (const document of documents) {
        const identifier = document.resource.identifier;
        const found = await find(identifier);
        if (found) lookup[identifier] = found;
    }
    return lookup;
}


function filterOnDifferentialImport(existingDocuments: Map<Document>,
                                    options: ImportOptions,
                                    documents: Array<Document>) {

    return options.differentialImport !== true
            ? documents
            : documents.filter(document => 
                existingDocuments[document.resource.identifier] === undefined);
}



function preprocessDocuments(existingDocuments: Map<Document>,
                             helpers: ImportHelpers,
                             options: ImportOptions,
                             documents: Array<Document>): Map<Document> {

    const preprocess = helpers.preprocessDocument ?? identity;                                

    const mergeDocs = {};

    for (let document of documents) {
        const existingDocument = existingDocuments[document.resource.identifier];
        if (options.mergeMode === true) {
            if (!existingDocument) throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];

            document._id = existingDocument._id;
            document.resource.id = existingDocument.resource.id;

            mergeDocs[existingDocument.resource.id] = preprocess(existingDocument);
        } else if (existingDocument) {
            throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
    }

    return mergeDocs;
}
