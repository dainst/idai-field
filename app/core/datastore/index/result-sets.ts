import {intersection, NestedArray, union, subtract} from 'tsfun';
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

        if (mode !== 'subtract') {
            resultSets.addSets.push(keys);
        }  else {
            resultSets.subtractSets.push(keys);
        }
    }


    export function collapse(resultSets: ResultSets): Array<IndexItem> {

        const addSetIds: string[] = intersection(resultSets.addSets);

        return pickFromMap(resultSets,
            resultSets.subtractSets.length === 0
                ? addSetIds
                : subtract(union(resultSets.subtractSets))(addSetIds)
        );
    }


    export function unify(resultSets: ResultSets): Array<IndexItem> {

        return pickFromMap(resultSets, union(resultSets.addSets));
    }


    function pickFromMap(resultSets: ResultSets, ids: string[]) {

        return ids.map(id => resultSets.map[id]);
    }
}