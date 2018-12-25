import {NestedArray, union, uniteObject} from 'tsfun';
import {SimpleIndexItem} from './index-item';


type IndexItemMap = {[id: string]: SimpleIndexItem};


export interface ResultSets {

    addSets: NestedArray<string>,
    subtractSets: NestedArray<string>,
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

        for (let addSet of resultSets.addSets) {
            if (addSet.length > 0) return false; // TODO do with some
        }

        return true;
    }


    export function combine(resultSets: ResultSets,
                            indexItems: Array<SimpleIndexItem>, mode: string = 'add') {

        const indexItemsMap = intoObject(indexItems);
        resultSets.map = uniteObject(indexItemsMap)(resultSets.map);

        if (mode !== 'subtract') {
            resultSets.addSets.push(Object.keys(indexItemsMap));
        }  else {
            resultSets.subtractSets.push(Object.keys(indexItemsMap));
        }
    }


    export function collapse(resultSets: ResultSets): Array<SimpleIndexItem> {

        const addSetIds: string[] = getIntersecting(resultSets.addSets);

        return pickFromMap(resultSets,
            resultSets.subtractSets.length === 0
                ? addSetIds
                : subtract(addSetIds, union(resultSets.subtractSets))
        );
    }


    export function unify(resultSets: ResultSets): Array<SimpleIndexItem> {

        return pickFromMap(resultSets, union(resultSets.addSets));
    }


    function pickFromMap(resultSets: ResultSets, ids: string[]) {

        return ids.map(id => resultSets.map[id]);
    }


    function intoObject(indexItems: Array<SimpleIndexItem>) {

        return indexItems
            .reduce((acc: IndexItemMap, item) => (acc[item.id] = item, acc), {});
    }


    function subtract(ids: string[], idsToSubtract: string[]) {

        return ids.filter(id => !idsToSubtract.includes(id));
    }


    function getIntersecting(idSets: string[][]) {

        let result: string[] = idSets[0];

        if (idSets.length > 1) {
            result = result.filter(id => {
                for (let idSet of idSets.slice(1)) {
                    if (!idSet.includes(id)) return false;
                }
                return true;
            });
        }

        return result;
    }
}