import {intersection, NestedArray, subtract, union} from 'tsfun';
import {uniteObject, intersectObject, empty} from 'tsfun';
import {SimpleIndexItem} from './index-item';
import {clone} from '../../../util/object-util';


type IndexItemMap = {[id: string]: SimpleIndexItem};

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ResultSets {

    // Hide constructor on purpose to force usage of make.
    // This way one can not modify the sets directly. One can
    // only start with make or copy and then modify via combine.
    private constructor(

        private addSets: NestedArray<string>,
        private subtractSets: NestedArray<string>,
        private map: IndexItemMap
    ) {}


    public static make(): ResultSets {

        return new ResultSets ([], [], {})
    }


    public isEmpty(): boolean {

        return empty(this.addSets) && empty(this.subtractSets);
    }


    public combine(
        indexItems: Array<SimpleIndexItem>,
        mode: string = 'add'): ResultSets {

        const indexItemsMap = ResultSets.intoObject(indexItems);

        const copy = this.copy();
        copy.map = uniteObject(indexItemsMap)(copy.map);

        if (mode !== 'subtract') copy.addSets.push(Object.keys(indexItemsMap));
        else copy.subtractSets.push(Object.keys(indexItemsMap));

        return copy;
    }


    public collapse(): Array<SimpleIndexItem> {

        return this.pickFromMap(
                subtract(...this.subtractSets)(intersection(this.addSets))
                );
    }


    public unify(): Array<SimpleIndexItem> {

        return this.pickFromMap(
                union(this.addSets)
                );
    }


    private pickFromMap(ids: Array<string>) {

        return Object.values(intersectObject(ids)(this.map))
    }


    private copy(): ResultSets {

        return new ResultSets(
            clone(this.addSets),
            clone(this.subtractSets),
            clone(this.map)
        );
    }


    private static intoObject(indexItems: Array<SimpleIndexItem>) {

        return indexItems
            .reduce((acc: IndexItemMap, item) => (acc[item.id] = item, acc), {});
    }
}