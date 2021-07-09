import {Map, on, Predicate} from 'tsfun';
import {makeLookup, mapToArray} from './transformers';
import {sortStructArray} from './sort-struct-array';
import { SortUtil } from './sort-util';


export type Name = string;

export interface Named { name: Name }


/**
 * A common interface for Maps having the `name` property.
 * Provides utilities to work with (collections of) such structures.
 * 
 * When extending Named, make sure `name` is a **unique** property
 * of your data structures 
 * (see `arrayToMap`, where name will be repurposed as map key).
 * 
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export namespace Named {

    export const NAME = 'name';

    /**
     * as: [{ name: '17', e: 9 }, { name: '19', e: 7 }]
     * ->
     * { '17': { e: 9, name: '17' }, { '19': { e: 7, name: '19' }}}
     */
    export function arrayToMap<A extends Named>(as: Array<A>): Map<A> {

        return makeLookup(Named.NAME, as);
    }


    export function mapToNamedArray<A extends Map<any>>(m: Map<A>) {

        return mapToArray(Named.NAME)(m) as Array<Named | Map<any>>;
    }
    
    
    export function sortArray(order: string[]) {
    
        return <A extends (Named | Map<any>)>(items: Array<A>): Array<A> => {
    
            return sortStructArray(order, Named.NAME)(items) as any;
        }
    }


    export function byName(a: Named, b: Named) { // to be used with sort

        return SortUtil.alnumCompare(a.name, b.name);
    }
    
    
    export const onName = (p: Predicate) => on(Named.NAME, p);
    
    
    export const toName = (named: Named) => named.name;
}
