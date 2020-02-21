import {arrayEqual, getOn, isNot, on, undefinedOrEmpty} from 'tsfun';
import {unionBy} from 'tsfun/by';
import {forEach as asyncForEach} from 'tsfun/async';
import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {HIERARCHICAL_RELATIONS} from '../../model/relation-constants';
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {Id, Identifier} from './types';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {makeLookup} from '../../util/utils';


export const unionOfDocuments = unionBy(on('resource.id'));


export const makeDocumentsLookup = makeLookup('resource.id');


export function assertLegalCombination(mergeMode: boolean|undefined, mainTypeDocumentId: string|undefined) {

    if (mainTypeDocumentId && mergeMode) {
        throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
    }
}


export function assertInSameOperationWith(document: Document) { return (targetDocument: Document) => {

    const documentRecordedIn = getOn('resource.relations.' + RECORDED_IN, undefined)(document);
    const targetDocumentRecordedIn = getOn('resource.relations.' + RECORDED_IN, undefined)(targetDocument);


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