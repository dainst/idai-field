import {ListUtil} from '../../../util/list-util';
import {SimpleIndexItem} from './index-item';
import {ObjectUtil} from "../../../util/object-util";


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
        private map: {[id: string]: SimpleIndexItem}
    ) {} // hide on purpose to force usage of make or copy


    public static make(): ResultSets {

        return new ResultSets ([], [], {})
    }


    public copy(): ResultSets {

        return new ResultSets(
            ObjectUtil.cloneAny(this.addSets),
            ObjectUtil.cloneAny(this.subtractSets),
            ObjectUtil.cloneAny(this.map)
        );
    }


    public isEmpty(): boolean {

        return this.addSets.length == 0 && this.subtractSets.length == 0;
    }



    public combine(
        set: Array<SimpleIndexItem>|undefined,
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
    public intersect(): Array<SimpleIndexItem> {

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
    public unify(): Array<SimpleIndexItem> {

        return ResultSets.pickFromMap(this.map,

            ListUtil.union(this.addSets));
    }


    private static putToMap(map: {[id: string]: SimpleIndexItem}, set: Array<SimpleIndexItem>): void {

        set.reduce((acc: any, item) => {
            acc[item.id] = item;
            return acc;
        }, map);
    }


    private static pickFromMap(map: {[id: string]: SimpleIndexItem}, indices: Array<string>): Array<SimpleIndexItem> {

        return indices.reduce((acc, index: string) => {
            acc.push(map[index] as never);
            return acc;
        }, []);
    }
}