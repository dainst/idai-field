import {FieldResource, Query, IdaiType} from 'idai-components-2';
import {FieldDocumentFindResult} from '../datastore/field/field-read-datastore';
import {reduce} from 'tsfun';


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


/**
 * Fills up items with defaultVal, until it reaches the specified targetSize
 *
 * @param targetSize
 * @param defaultVal
 */
export function fillUpToSize(targetSize: number, defaultVal: any) { // TODO maybe move, review Array.prototype.fill

    /**
     * @param items
     */
    return (items: any[]) => {

        const fills = makeEmptyDenseArray(targetSize - items.length).map(() => defaultVal);
        return items.concat(fills);
    }
}


export const when = <A, B>(p: (_: A) => boolean, f: (_: A) => B, otherwise: B) => (v: A): B => p(v) ? f(v) : otherwise; // TODO move to tsfun


export const flatten = reduce((acc: any, val: any) => acc.concat(val), [] as any); // TODO move to tsfun