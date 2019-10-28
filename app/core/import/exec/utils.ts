import {Document} from 'idai-components-2/src/model/core/document';
import {unionBy} from 'tsfun-core';
import {arrayEqual, getOnOr, isNot, on, undefinedOrEmpty} from 'tsfun';
import {ImportErrors as E} from './import-errors';
import {HIERARCHICAL_RELATIONS} from '../../model/relation-constants';
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {makeLookup} from '../util';
import {Relations} from 'idai-components-2/src/model/core/relations';
import {Id, Identifier} from './types';
import {asyncForEach} from 'tsfun-extra';
import {DocumentDatastore} from '../../datastore/document-datastore';


export const unionOfDocuments = unionBy(on('resource.id'));


export const makeDocumentsLookup = makeLookup('resource.id');


export function assertLegalCombination(mergeMode: boolean|undefined, mainTypeDocumentId: string|undefined) {

    if (mainTypeDocumentId && mergeMode) {
        throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
    }
}


export function assertInSameOperationWith(document: Document) { return (targetDocument: Document) => {

    const documentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(document);
    const targetDocumentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(targetDocument);


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