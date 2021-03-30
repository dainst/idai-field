import {Document} from 'idai-field-core';

export type AssertIsAllowedRelationDomainType = (domainCategoryName: string,
                                                 rangeCategoryName: string,
                                                 relationName: string,
                                                 identifier: string) => void;

export type Find = (identifier: string) => Promise<Document|undefined>;
export type GenerateId = () => string;

export type Id = string;
export type Identifier = string;
export type IdentifierMap = { [identifier: string]: Id };

export type IdMap = { [id: string]: Document };
export type Get = (resourceId: string) => Promise<Document>;
export type GetInverseRelation = (propertyName: string) => string|undefined;
