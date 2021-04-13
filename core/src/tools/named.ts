import {Map, on, Predicate} from 'tsfun';
import {makeLookup, mapToArray} from './transformers';
import {sortStructArray} from './sort-struct-array';
import { SortUtil } from './sort-util';


/**
 * @author Daniel de Oliveira
 */

export type Name = string;

export type Label = string;


export interface Named { name: Name }

export interface Labelled { label?: Label }


export module Labelled {

    export const LABEL = 'label';
}


export module Named {

    export const NAME = 'name';

    /**
     * as: [{ name: '17', e: 9 }, { name: '19', e: 7 }]
     * ->
     * { '17': { e: 9, name: '17' }, { '19': { e: 7, name: '19' }}}
     */
    export function arrayToMap<A extends Named>(as: Array<A>): Map<A> {

        return makeLookup(Named.NAME)(as);
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
    
    
    // export const toName = to<Name /* users must make sure this is to be expected */>(Named.NAME);
    export const toName = (named: Named) => named.name;
}
