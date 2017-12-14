import {IndexItem} from "./index-item";
import {SortUtil} from '../../../util/sort-util';
import {ListUtil} from '../../../util/list-util';

export interface ResultSets {

    addSets: Array<  // multiple result sets
        Array<            // a single result set
            string
            >>,

    subtractSets: Array<Array<string>>;
    map: {[id: string]: IndexItem};
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
            subtractSets: [],
            map: {}
        }
    }


    public static isEmpty(resultSets: ResultSets): boolean {

        return resultSets.addSets.length == 0 && resultSets.subtractSets.length == 0;
    }


    public static copy(resultSets: ResultSets): ResultSets {

        return JSON.parse(JSON.stringify(resultSets));
    }


    public static combine(
        resultSets: ResultSets,
        set: Array<IndexItem>|undefined,
        mode: string = 'add'): ResultSets {

        const copy = ResultSets.copy(resultSets);
        if (!set) return copy;

        ResultSets.putToMap(copy.map, set);

        if (mode !== 'subtract') copy.addSets.push(set.map(item => item.id));
        else copy.subtractSets.push(set.map(item => item.id));
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

        return ResultSets.pickFromMap(resultSets.map,

            ListUtil.subtractTwo(
                resultSets.subtractSets,
                ListUtil.intersect(
                    resultSets.addSets
                )
            )
        );
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
    public static unify(resultSets: ResultSets): Array<IndexItem> {

        return ResultSets.pickFromMap(resultSets.map,

            ListUtil.union(resultSets.addSets));
    }


    private static putToMap(map: {[id: string]: IndexItem},
                            set: Array<IndexItem>): {[id: string]: IndexItem} {

        return set.reduce((acc: any, item) => {
            acc[ResultSets.f(item)] = item;
            return acc;
        }, map);
    }


    private static pickFromMap(map: {[id: string]: IndexItem}, indices: Array<string>): Array<IndexItem> {

        return indices.reduce((acc, index: string) => {
            acc.push(map[index] as never);
            return acc;
        }, []);
    }
}