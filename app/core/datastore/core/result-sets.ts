import {IndexItem} from "./index-item";
import {SortUtil} from '../../../util/sort-util';
import {ListUtil} from '../../../util/list-util';


/**
 * Companion object
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ResultSets {

    private constructor(
        private addSets: Array<  // multiple result sets
            Array<            // a single result set
                string
                >>,
        private subtractSets: Array<Array<string>>,
        private map: {[id: string]: IndexItem}
    ) {} // hide on purpose to force usage of make or copy


    public static make(): ResultSets {

        return new ResultSets ([], [], {})
    }


    public copy(): ResultSets {

        return new ResultSets(
            JSON.parse(JSON.stringify(this.addSets)),
            JSON.parse(JSON.stringify(this.subtractSets)),
            JSON.parse(JSON.stringify(this.map))
        );
    }


    public isEmpty(): boolean {

        return this.addSets.length == 0 && this.subtractSets.length == 0;
    }



    public combine(
        set: Array<IndexItem>|undefined,
        mode: string = 'add'): ResultSets {

        const copy = this.copy();
        if (!set) return copy;

        ResultSets.putToMap(copy.map, set);

        if (mode !== 'subtract') copy.addSets.push(set.map(item => item.id));
        else copy.subtractSets.push(set.map(item => item.id));

        return copy;
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
    public intersect(): Array<IndexItem> {

        return ResultSets.pickFromMap(this.map,

            ListUtil.subtractTwo(
                this.subtractSets,
                ListUtil.intersect(
                    this.addSets
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
    public unify(): Array<IndexItem> {

        return ResultSets.pickFromMap(this.map,

            ListUtil.union(this.addSets));
    }


    public static generateOrderedResultList(resultSets: ResultSets): Array<any> {

        return resultSets.intersect()
            .sort((a: any, b: any) =>
                // we know that an IndexItem created with from has the identifier field
                SortUtil.alnumCompare(a['identifier'], b['identifier']))
            .map((e: any) => e['id']);
    }


    private static putToMap(map: {[id: string]: IndexItem}, set: Array<IndexItem>): void {

        set.reduce((acc: any, item) => {
            acc[item.id] = item;
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