import {IndexItem} from "./index-item";
import {SortUtil} from '../../../util/sort-util';

export interface ResultSets {

    addSets: Array<  // multiple result sets
        Array<            // a single result set
            IndexItem
            >>,

    subtractSets: Array<Array<IndexItem>>;
}

/**
 * Companion object
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ResultSets {

    private static f = (a: IndexItem): string => a.id;

    private constructor() {} // hide on purpose to force usage of make or copy

    public static make(): ResultSets {

        return {
            addSets: [],
            subtractSets: []
        }
    }


    public static isEmpty(resultSets: ResultSets): boolean {

        return resultSets.addSets.length == 0 && resultSets.subtractSets.length == 0;
    }


    public static copy(resultSets: ResultSets): ResultSets {

        return JSON.parse(JSON.stringify(resultSets));
    }


    public static add(resultSets: ResultSets, set: Array<IndexItem>|undefined): ResultSets {

        const copy = ResultSets.copy(resultSets);
        if (!set) return copy;
        copy.addSets.push(set);
        return copy;
    }


    public static subtract(resultSets: ResultSets, set: Array<IndexItem>|undefined): ResultSets {

        const copy = ResultSets.copy(resultSets);
        if (!set) return copy;
        copy.subtractSets.push(set);
        return copy;
    }


    public static generateOrderedResultList(resultSets: ResultSets): Array<any> {

        return ResultSets.intersect(resultSets)
            .sort((a: any, b: any) =>
                // we know that an IndexItem created with from has the identifier field
                SortUtil.alnumCompare(a['identifier'], b['identifier']))
            .map((e: any) => e['id']);
    }


    /**
     * Finds the elements that are common to all sets. Elements from subtract sets are removed from the result.
     *
     * Assuming, one adds the two add sets
     *
     *   [{id:'1'}, {id:'2'}, {id:'3'}]
     *   [{id:'2'}, {id:'3'}]
     *
     *   and the subtract set
     *
     *   [{id:'3'}]
     *
     * intersect would return
     *
     *   [{id:'2'}]
     */
    public static intersect(resultSets: ResultSets): Array<IndexItem> {

        const result = ResultSets.accumulateAdditively(resultSets.addSets);

        resultSets.subtractSets.forEach(set =>
                set.map(object =>
                    result.map(obj =>
                        ResultSets.f(obj)).indexOf(ResultSets.f(object)))
            .filter(i => i > -1)
            .reverse()
            .forEach(i => result.splice(i, 1)));

        return result;
    }


    /**
     * Returns a single result set which contains the objects of all add sets
     *
     *  Assuming, one adds the two sets
     *
     *   [{id:'1'}, {id:'2'}, {id:'3'}]
     *   [{id:'2'}, {id:'3'}]
     *
     * unify would return
     *
     *   [{id:'1'}, {id:'2'}, {id:'3'}]
     */
    public static unify(resultSets: ResultSets): Array<Object> {

        const result: any = {};

        for (let resultSet of resultSets.addSets) {
            for (let item of resultSet) {
                result[ResultSets.f(item)] = item;
            }
        }

        return Object.keys(result).map(key => (result as any)[key]);
    }


    private static accumulateAdditively(sets: Array<Array<IndexItem>>): Array<IndexItem> {

        return sets.reduce((accumulatedSet, comparisonSet) =>
                accumulatedSet.filter(accumulatedSetIndexItem => comparisonSet.map(addSetIndexItem =>
                    ResultSets.f(addSetIndexItem)).indexOf(ResultSets.f(accumulatedSetIndexItem)) != -1)
            , sets[0]);
    }
}