import {is, on} from 'tsfun';
import {findInTreelist, Treelist} from './treelist';
import {Named} from '../util/named';
import {Name} from '../constants';


export function findInNamedTreelist<N extends Named>(match: Name, t: Treelist<N>): N|undefined {

    const result = findInTreelist(on(Named.NAME, is(match)), t);
    return result ? result[0] : undefined;
}


export function isTopLevelItemOrChildThereof(t: Treelist<Named>,
                                             name: Name, // TODO switch with 3rd arg and add varargs to simplify calls such as in isGeometryCategory
                                             firstLevelItem: Name): boolean {

    const found = t.find(on([0, Named.NAME], is(firstLevelItem)));
    return found ?
        findInNamedTreelist(name, [found as any]) !== undefined
        : false;
}
