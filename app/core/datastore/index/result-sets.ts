import {intersection, union, subtract, lookup, flow, map, cond, on, isNot, empty} from 'tsfun';
import {IndexItem} from './index-item';

type ResourceId = string;
type IndexItemMap = { [id: string]: IndexItem };


export interface ResultSets {

    addSets: Array<Array<ResourceId>>,
    subtractSets: Array<Array<ResourceId>>,
    map: IndexItemMap
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ResultSets {


    export function make(): ResultSets {

        return { addSets: [], subtractSets: [], map: {} };
    }


    export function isEmpty(resultSets: ResultSets): boolean {

        return resultSets.addSets.length === 0 &&
            resultSets.subtractSets.length === 0;
    }


    export function containsOnlyEmptyAddSets(resultSets: ResultSets): boolean {

        if (resultSets.addSets.length === 0) return false;
        return !resultSets.addSets
            .some(addSet => addSet.length > 0);
    }


    export function combine(resultSets: ResultSets,
                            indexItems: Array<IndexItem>,
                            subtract: undefined|true = undefined): void {

        const keys = [];
        for (let item of indexItems) {
            resultSets.map[item.id] = item;
            keys.push(item.id)
        }

        (!subtract
            ? resultSets.addSets
            : resultSets.subtractSets)
            .push(keys);
    }


    export function collapse(resultSets: ResultSets): Array<IndexItem> {

        return flow(
            intersection(resultSets.addSets),
            cond(
                isNot(empty)(resultSets.subtractSets),
                subtract(union(resultSets.subtractSets))),
            pickFrom(resultSets));
    }


    export function unify(resultSets: ResultSets): Array<IndexItem> {

        return flow(
            union(resultSets.addSets),
            pickFrom(resultSets));
    }


    const pickFrom = (resultSets: ResultSets) => map(lookup(resultSets.map));
}