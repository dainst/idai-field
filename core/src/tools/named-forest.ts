import {drop, identity, includedIn, is, isArray, isNot, on, take} from 'tsfun';
import { Named, Name } from './named';
import { Tree, Forest } from './forest';


export function findInNamedTreeList<N extends Named>(match: Name, t: Forest<N>): N|undefined {

    const result: any = Tree.find(t, Named.onName(is(match)));
    return result ? result.item : undefined;
}


export function filterTrees<N extends Named>(t: Forest<N>, match: Name, ...moreMatches: Name[]): Forest<N>;
export function filterTrees<N extends Named>(match: Name, ...moreMatches: Name[]): (t: Forest<N>) => Forest<N>;
export function filterTrees(a: any, ...bs: any[]): any {

    return _filterTrees(false, a, bs);
}


export function removeTrees<N extends Named>(t: Forest<N>, match: Name, ...moreMatches: Name[]): Forest<N>;
export function removeTrees<N extends Named>(match: Name, ...moreMatches: Name[]): (t: Forest<N>) => Forest<N>;
export function removeTrees(a: any, ...bs: any[]): any {

    return _filterTrees(true, a, bs);
}


export function isTopLevelItemOrChildThereof(t: Forest<Named>,
                                             match: Name,
                                             firstLevelItem: Name,
                                             ...moreFirstLevelItems: Name[]): boolean {

    const filtered = filterTrees(t, firstLevelItem, ...moreFirstLevelItems);
    return findInNamedTreeList(match, filtered) !== undefined;
}


function _filterTrees<N extends Named>(invert: boolean, a: any, bs: any[]): Forest<N> {

    const $ = (t: any, match: any, moreMatches: any) => t.filter(
        on(Tree.ITEMNAMEPATH,
            ((invert ? isNot : identity)(includedIn([match].concat(moreMatches))))
        ));

    return isArray(a)
        ? $(a, take(1, bs)[0], drop(1, bs))
        : (t: any) => $(t, a, bs);
}
