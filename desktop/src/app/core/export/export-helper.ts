import {FieldResource, Category, Query, FindResult, Resource, Document} from 'idai-field-core';


export type Count = number; // -1 signals that there is not usable count
export type CategoryCount = [Category, Count];

export type Get = (id: Resource.Id) => Promise<Document>;
export type Find = (query: Query) => Promise<FindResult>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (category: Category, relations: string[])
    => (resources: Array<FieldResource>) => Promise<void>;
