import {FieldResource, Query, IdaiType} from 'idai-components-2';
import {FieldDocumentFindResult} from '../datastore/field/field-read-datastore';
import {take, drop, flow, map, reduce} from 'tsfun';

export type Count = number; // -1 signals that there is not usable count
export type ResourceTypeCount = [ IdaiType, Count ];

export type Find = (query: Query) => Promise<FieldDocumentFindResult>;
export type GetIdentifierForId = (resourceId: string) => Promise<string>;
export type PerformExport = (resources: Array<FieldResource>, resourceType: IdaiType, relations: string[]) => Promise<void>;


/**
 * @param where
 * @param nrOfNewItems
 * @param computeReplacement
 */
export function expand(where: number,
                       nrOfNewItems: number,
                       computeReplacement: (removed: any) => any[]) {

    /**
     * @param itms expected to be a dense array
     */
    return (itms: any[]) => {

        const itemsBefore = take(where)(itms);
        const itemsAfter = drop(where + nrOfNewItems)(itms);

        const itemsReplaced =
            flow<any>(itms,
                drop(where),
                take(nrOfNewItems),
                map(computeReplacement),
                reduce((acc: any, val: any) => acc.concat(val), [] as any)); // TODO make concat (or flatten, opposite of flatMap) function that concats several aas into one as

        return itemsBefore.concat(itemsReplaced).concat(itemsAfter);
    }
}


/**
 * see https://mail.mozilla.org/pipermail/es-discuss/2012-April/022273.html
 *
 * TODO move to tsfun. make empty function which takes an existing array or map and returns something of the same type
 */
export function makeEmptyDenseArray(size: number) {

    return Array.apply(null, Array(size))
}