import {FieldResource, Query, IdaiType} from 'idai-components-2';
import {FieldDocumentFindResult} from '../datastore/field/field-read-datastore';


export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];

export type Find = (query: Query) => Promise<FieldDocumentFindResult>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (resources: Array<FieldResource>, resourceType: IdaiType, relations: string[]) => Promise<void>;


/**
 * see https://mail.mozilla.org/pipermail/es-discuss/2012-April/022273.html
 * TODO move to tsfun. make empty function which takes an existing array or map and returns something of the same type
 */
export function makeEmptyDenseArray(size: number) {

    return Array.apply(null, Array(size))
}