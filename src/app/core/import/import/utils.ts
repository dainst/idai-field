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


export const unionOfDocuments = (docs: Array<Array<Document>>) => union(on('resource.id'), docs);


export const makeDocumentsLookup = makeLookup('resource.id');


export function assertLegalCombination(mergeMode: boolean|undefined, operationId: string|undefined) {

    if (operationId && mergeMode) {
        throw 'FATAL ERROR - illegal argument combination - operationId and mergeIfExists must not be both truthy';
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
