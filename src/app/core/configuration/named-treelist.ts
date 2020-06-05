import {includedIn, is, on} from 'tsfun';
import {findInTreelist, Treelist} from './treelist';
import {Named} from '../util/named';
import {Name} from '../constants';


export function findInNamedTreelist<N extends Named>(match: Name, t: Treelist<N>): N|undefined {

    const result = findInTreelist(on(Named.NAME, is(match)), t);
    return result ? result[0] : undefined;
}


export function isTopLevelItemOrChildThereof(t: Treelist<Named>,
                                             match: Name,
                                             firstLevelItem: Name,
                                             ...moreFirstLevelItems: Name[]): boolean {

    const filtered = t.filter(on([0, Named.NAME], includedIn([firstLevelItem].concat(moreFirstLevelItems))));
    return findInNamedTreelist(match, filtered) !== undefined;
}
