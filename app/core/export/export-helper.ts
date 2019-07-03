import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {Query} from 'idai-components-2/src/datastore/query';
import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {FieldDocumentFindResult} from '../datastore/field/field-read-datastore';


export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];

export type Find = (query: Query) => Promise<FieldDocumentFindResult>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (documents: Array<FieldDocument>, resourceType: IdaiType, relations: string[]) => Promise<void>;