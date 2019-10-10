import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';


export type AssertIsAllowedRelationDomainType = (domainTypeName: string,
                                                 rangeTypeName: string,
                                                 relationName: string,
                                                 identifier: string) => void;

export type ImportFunction =
    (documents: Array<Document>,
     datastore: DocumentDatastore,
     username: string) =>
        Promise<{ errors: string[][], successfulImports: number }>;

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