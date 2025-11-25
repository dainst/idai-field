import { FieldResource, CategoryForm, Query, Datastore, Resource, Document } from 'idai-field-core';
import { ExportResult } from './export-runner';


export type Count = number; // -1 signals that there is not usable count
export type CategoryCount = [CategoryForm, Count];

export type Get = (id: Resource.Id) => Promise<Document>;
export type Find = (query: Query) => Promise<Datastore.FindResult>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (category: CategoryForm, relations: string[])
    => (resources: Array<FieldResource>) => Promise<ExportResult>;
