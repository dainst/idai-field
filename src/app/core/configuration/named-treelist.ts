import {is, on} from 'tsfun';
import {findInTreelist, Treelist} from './treelist';
import {Named} from '../util/named';
import {Name} from '../constants';


export function findInNamedTreelist<N extends Named>(match: Name, t: Treelist<N>): N|undefined {

    const result = findInTreelist(on(Named.NAME, is(match)), t);
    return result ? result[0] : undefined;
}
