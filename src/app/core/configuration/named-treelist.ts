import {drop, identity, includedIn, is, isArray, isNot, on, take} from 'tsfun';
import {findInTreelist, Treelist} from './treelist';
import {Named} from '../util/named';
import {Name} from '../constants';


export function findInNamedTreelist<N extends Named>(match: Name, t: Treelist<N>): N|undefined {

    const result = findInTreelist(on(Named.NAME, is(match)), t);
    return result ? result[0] : undefined;
}


export function filterTrees<N extends Named>(t: Treelist<N>, match: Name, ...moreMatches: Name[]): Treelist<N>;
export function filterTrees<N extends Named>(match: Name, ...moreMatches: Name[]): (t: Treelist<N>) => Treelist<N>;
export function filterTrees<N extends Named>(a: any, ...bs: any[]): any {

    return isArray(a) // TODO make this case distinction part of _filterTrees, so that we can use it in removeTrees, too
        ? _filterTrees(a, take(1, bs)[0], drop(1, bs))
        : (t: any) => _filterTrees(t, a, bs);
}


export function removeTrees<N extends Named>(t: Treelist<N>, match: Name, ...moreMatches: Name[]): Treelist<N> {

    return _filterTrees(t, match, moreMatches, true);
}


export function isTopLevelItemOrChildThereof(t: Treelist<Named>,
                                             match: Name,
                                             firstLevelItem: Name,
                                             ...moreFirstLevelItems: Name[]): boolean {

    const filtered = _filterTrees(t, firstLevelItem, moreFirstLevelItems);
    return findInNamedTreelist(match, filtered) !== undefined;
}


function _filterTrees<N extends Named>(t: Treelist<N>, match: Name, moreMatches: Name[], invert = false): Treelist<N> {

    return t.filter(
        on([0, Named.NAME],
            ((invert ? isNot : identity)(includedIn([match].concat(moreMatches))))
        ));
}
