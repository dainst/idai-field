import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Settings} from '../../settings/settings';


export type AssertIsAllowedRelationDomainType = (domainCategoryName: string,
                                                 rangeCategoryName: string,
                                                 relationName: string,
                                                 identifier: string) => void;

export type ImportFunction =
    (documents: Array<Document>) =>
        Promise<{ errors: string[][], successfulImports: number }>;

export type Find = (identifier: string) => Promise<Document|undefined>;
export type GenerateId = () => string;

export type Id = string;
export type Identifier = string;
export type IdentifierMap = { [identifier: string]: Id };

export type IdMap = { [id: string]: Document };
export type Get = (resourceId: string) => Promise<Document>;
export type GetInverseRelation = (propertyName: string) => string|undefined;
