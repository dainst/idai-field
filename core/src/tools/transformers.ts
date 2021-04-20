import {compose, Map, map, to, assoc, Path} from 'tsfun';
import {assocReduce} from './assoc-reduce';


// @author Daniel de Oliveira
// @author Sebastian Cuy


// TODO add uncurried version
/**
 * path: 'd.e'
 * as: [{ d: { e: 17 }}, { d: { e: 19 }}]
 * ->
 * { 17: { d: { e: 17 }}, 19: { d: { e: 19 }}}
 */
export function makeLookup(path: Path) {

    return <A>(as: Array<A>): Map<A> =>
        assocReduce((a: A) => [to(path)(a), a], {})(as);
}


export function addKeyAsProp<A extends Map<any>>(prop: string) {

    return map((a: A, key: string) => assoc(prop, key)(a));
}


export function mapToArray(prop: string) {

    return compose(addKeyAsProp(prop) as any, Object.values);
}
