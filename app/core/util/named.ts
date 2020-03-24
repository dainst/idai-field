import {Map, values} from 'tsfun';
import {SortUtil} from './sort-util';
import {makeLookup} from './utils';


// @author Daniel de Oliveira

// --- please do not remove, even if not used currently ---

// TODO move to tsfun/util ?
export interface Named { name: Name }

type Name = string;

export module Named {

    export const NAME = 'name';
}

/**
 * as: [{ name: '17', e: 9 }, { name: '19', e: 7 }]
 * ->
 * { '17': { e: 9, name: '17' }, { '19': { e: 7, name: '19' }}}
 */
export function namedArrayToNamedMap<A extends Named>(as: Array<A>): Map<A> {

    return makeLookup(Named.NAME)(as); // TODO maybe remove names afterwards
}

export function namedMapToNamedArray<A extends Named>(m: Map<A>): Array<A> {

    return values(m);
}

export const byName = (a: Named, b: Named) => SortUtil.alnumCompare(a.name, b.name); // to be used with sort

export type NameIdentifiedObjectArray<A extends Named> = Array<A>;

type NameIdentifiedObjectArray = Array<Named>;