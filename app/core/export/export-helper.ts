import {FieldResource, Query, IdaiType} from 'idai-components-2';
import {FieldDocumentFindResult} from '../datastore/field/field-read-datastore';


export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];

export type Find = (query: Query) => Promise<FieldDocumentFindResult>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (resources: Array<FieldResource>, resourceType: IdaiType, relations: string[]) => Promise<void>;