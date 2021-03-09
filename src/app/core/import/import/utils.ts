import {arrayEqual, isNot, on, undefinedOrEmpty, union} from 'tsfun';
import {get} from 'tsfun/struct';
import {forEach as asyncForEach} from 'tsfun/async';
import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {HierarchicalRelations} from '../../model/relation-constants';
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {Id, Identifier} from './types';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {makeLookup} from '../../util/transformers';
import {Lookup} from '../../util/utils';
import {ImportOptions} from './import-documents';


export const unionOfDocuments = (docs: Array<Array<Document>>) => union(on('resource.id'), docs);


export const makeDocumentsLookup: (ds: Array<Document>) => Lookup<Document> = makeLookup('resource.id');


export function assertLegalCombination(importOptions: ImportOptions) {

    if (importOptions.mergeMode) {

        if (importOptions.operationId) {
            throw 'FATAL ERROR - illegal argument combination '
            + '- mergeMode and operationId must not be both truthy';
        }
        if (importOptions.differentialImport) {
            throw 'FATAL ERROR - illegal argument combination '
            + '- mergeMode and differentialImport must not be both true';
        }
    }
}


export function assertInSameOperationWith(document: Document) { return (targetDocument: Document) => {

    const documentRecordedIn = get('resource.relations.' + RECORDED_IN, undefined)(document);
    const targetDocumentRecordedIn = get('resource.relations.' + RECORDED_IN, undefined)(targetDocument);

    if (isNot(undefinedOrEmpty)(documentRecordedIn)
        && isNot(undefinedOrEmpty)(targetDocumentRecordedIn)
        && isNot(arrayEqual(targetDocumentRecordedIn))(documentRecordedIn)) {

        throw [E.MUST_BE_IN_SAME_OPERATION, document.resource.identifier, targetDocument.resource.identifier];
    }
}}



export async function iterateRelationsInImport(
    relations: Relations,
    asyncIterationFunction: (relation: string) => (idOrIdentifier: Id|Identifier, i: number) => Promise<void>): Promise<void> {

    for (let relation of Object.keys(relations)) {
        if (relations[relation] === null) continue;
        await asyncForEach(asyncIterationFunction(relation))(relations[relation]);
    }
}


export function findByIdentifier(datastore: DocumentDatastore) {

    return async (identifier: string): Promise<Document|undefined> => {

        const result = await datastore.find({ constraints: { 'identifier:match': identifier }});

        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
    }
}
