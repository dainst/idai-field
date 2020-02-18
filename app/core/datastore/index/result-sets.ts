import {intersection, NestedArray, union, subtract, lookup, flow, map} from 'tsfun';
import {IndexItem} from './index-item';

type ResourceId = string;
type IndexItemMap = {[id: string]: IndexItem};


export interface ResultSets {

    addSets: NestedArray<ResourceId>,
    subtractSets: NestedArray<ResourceId>,
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
                            indexItems: Array<IndexItem>, mode: string = 'add') {


        const keys = [];
        for (let item of indexItems) {
            resultSets.map[item.id] = item;
            keys.push(item.id)
        }

        (mode !== 'subtract'
            ? resultSets.addSets
            : resultSets.subtractSets)
            .push(keys);
    }


    export function collapse(resultSets: ResultSets): Array<IndexItem> {

        const addSetIds: string[] = intersection(resultSets.addSets);

        return flow(
            resultSets.subtractSets.length === 0
                ? addSetIds
                : subtract(union(resultSets.subtractSets))(addSetIds),
            pickFrom(resultSets));
    }


    export function unify(resultSets: ResultSets): Array<IndexItem> {

        return flow(
            union(resultSets.addSets),
            pickFrom(resultSets));
    }


    const pickFrom = (resultSets: ResultSets) => map(lookup(resultSets.map));
}