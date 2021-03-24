import {Map, on, Predicate, to} from 'tsfun';
import {SortUtil} from './sort-util';
import {makeLookup, mapToArray} from './transformers';
import {sortStructArray} from './sort-struct-array';


/**
 * @author Daniel de Oliveira
 */

type Name = string;

type Label = string;


export interface Named { name: Name }

export interface Labelled { label?: Label }


export module Named {

    export const NAME = 'name';
}

export module Labelled {

    export const LABEL = 'label';
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

        return sortStructArray(order, Named.NAME)(items);
    }
}


export function byName(a: Named, b: Named) { // to be used with sort

    return SortUtil.alnumCompare(a.name, b.name);
}


export const onName = (p: Predicate) => on(Named.NAME, p);


export const toName = to(Named.NAME);
