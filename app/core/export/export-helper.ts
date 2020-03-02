import {FieldResource, Query, Document} from 'idai-components-2';
import {IdaiFieldFindResult} from '../datastore/cached/cached-read-datastore';
import {IdaiType} from '../configuration/model/idai-type';
import {denseArray} from '../util/utils';


export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];

export type Find = (query: Query) => Promise<IdaiFieldFindResult<Document>>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (resourceType: IdaiType, relations: string[]) => (resources: Array<FieldResource>) => Promise<void>;





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

        const fills = denseArray(targetSize - items.length).map(() => defaultVal);
        return items.concat(fills);
    }
}