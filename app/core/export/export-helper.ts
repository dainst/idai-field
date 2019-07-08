import {FieldResource, Query, IdaiType} from 'idai-components-2';
import {FieldDocumentFindResult} from '../datastore/field/field-read-datastore';
import {arrayList} from 'tsfun';


export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];

export type Find = (query: Query) => Promise<FieldDocumentFindResult>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (resources: Array<FieldResource>, resourceType: IdaiType, relations: string[]) => Promise<void>;





/**
 * Fills up items with defaultVal, until it reaches the specified targetSize.
 * The amount of items filled in is based on the
 * difference of the size of items to the target size.
 *
 * @param targetSize
 * @param defaultVal
 */
export function fillUpToSize(targetSize: number, defaultVal: any) {

    /**
     * @param items
     */
    return (items: any[]) => {

        const fills = arrayList(targetSize - items.length).map(() => defaultVal);
        return items.concat(fills);
    }
}