import {Document} from 'idai-components-2/src/model/core/document';
import {arrayEqual, getOnOr, isNot, undefinedOrEmpty} from 'tsfun';
import {ImportErrors as E} from './import-errors';
import {HIERARCHICAL_RELATIONS} from '../../model/relation-constants';
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;


export type Find = (identifier: string) => Promise<Document|undefined>;
export type GenerateId = () => string;

export type Identifier = string;
export type IdentifierMap = { [identifier: string]: string };

export type ImportDocuments = Array<Document>;
export type TargetDocuments = Array<Document>;
export type MsgWithParams = string[];
export type ProcessResult = [ImportDocuments, TargetDocuments, MsgWithParams|undefined];

export type Id = string;
export type IdMap = { [id: string]: Document };
export type Get = (resourceId: string) => Promise<Document>;
export type GetInverseRelation = (propertyName: string) => string|undefined;


export function assertInSameOperationWith(document: Document) { return (targetDocument: Document) => {

    const documentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(document);
    const targetDocumentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(targetDocument);


    if (isNot(undefinedOrEmpty)(documentRecordedIn)
        && isNot(undefinedOrEmpty)(targetDocumentRecordedIn)
        && isNot(arrayEqual(targetDocumentRecordedIn))(documentRecordedIn)) {

        throw [E.MUST_BE_IN_SAME_OPERATION, document.resource.identifier, targetDocument.resource.identifier];
    }
}}