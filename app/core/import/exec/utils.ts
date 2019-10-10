import {Document} from 'idai-components-2/src/model/core/document';
import {unionBy} from 'tsfun-core';
import {arrayEqual, getOnOr, isNot, on, undefinedOrEmpty} from 'tsfun';
import {ImportErrors as E} from './import-errors';
import {HIERARCHICAL_RELATIONS} from '../../model/relation-constants';
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {makeLookup} from '../util';


export const unionOfDocuments = unionBy(on('resource.id'));


export const makeDocumentsLookup = makeLookup('resource.id');


export function assertLegalCombination(mainTypeDocumentId: string, mergeMode: boolean) {

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