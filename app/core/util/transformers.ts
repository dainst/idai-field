import {assoc, compose, getOn, map, Map, values} from 'tsfun';
import {assocReduce} from './utils';


// @author Daniel de Oliveira
// @author Sebastian Cuy


/**
 * path: 'd.e'
 * as: [{ d: { e: 17 }}, { d: { e: 19 }}]
 * ->
 * { 17: { d: { e: 17 }}, 19: { d: { e: 19 }}}
 */
export function makeLookup(path: string) {

    return <A>(as: Array<A>): Map<A> =>
        assocReduce((a: A) => [getOn(path)(a), a], {})(as);
}


export function addKeyAsProp<A extends Map>(prop: string): (m: Map<A>) => Map<A> {

    return map<any>((a: A, key: string) => assoc(prop, key)(a));
}


export function mapToArray(prop: string) {

    return compose(addKeyAsProp(prop), values);
}