import {is, Map, on, separate} from 'tsfun';
import {SortUtil} from './sort-util';
import {makeLookup, mapToArray} from './utils';
import {copy} from 'tsfun/src/collection';
import {Category} from '../configuration/model/category';


// @author Daniel de Oliveira

type Name = string;


export interface Named { name: Name }


export module Named {

    export const NAME = 'name';
}

/**
 * as: [{ name: '17', e: 9 }, { name: '19', e: 7 }]
 * ->
 * { '17': { e: 9, name: '17' }, { '19': { e: 7, name: '19' }}}
 */
export function namedArrayToNamedMap<A extends Named>(as: Array<A>): Map<A> {

    return makeLookup(Named.NAME)(as);
}


export function mapToNamedArray<A extends Map>(m: Map<A>) {

    return mapToArray(Named.NAME)(m) as Array<Named | Map>;
}


export function sortNamedArray(order: string[]) {

    return <A extends (Named | Map)>(items: Array<A>): Array<A> => {

        let source = copy(items);
        let sortedCategories: Array<Category> = [];

        for (let categoryName of order) {
            const [match, rest] = separate(on(Named.NAME, is(categoryName)))(source);
            sortedCategories = sortedCategories.concat(match);
            source = rest;
        }

        return sortedCategories.concat(source as any) as any;
    }
}


export function byName(a: Named, b: Named) { // to be used with sort

    return SortUtil.alnumCompare(a.name, b.name);
}

