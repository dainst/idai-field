import {FieldResource, Query, Document} from 'idai-components-2';
import {IdaiFieldFindResult} from '../datastore/cached/cached-read-datastore';
import {IdaiType} from '../configuration/model/idai-type';


export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];

export type Find = (query: Query) => Promise<IdaiFieldFindResult<Document>>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (resourceType: IdaiType, relations: string[]) => (resources: Array<FieldResource>) => Promise<void>;
