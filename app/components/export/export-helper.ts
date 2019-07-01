import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {Query} from 'idai-components-2/src/datastore/query';
import {FieldDocumentFindResult} from '../../core/datastore/field/field-read-datastore';


export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];
export type Find = (query: Query) => Promise<FieldDocumentFindResult>;