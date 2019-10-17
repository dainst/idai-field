import {append, compose, dropRight, flow, takeRight, to} from 'tsfun';


export function replaceLast<A>(as: Array<A>, replacement: A) {

    return replaceRight(as, 1, replacement);
}


export function replaceLastPair<A>(as: Array<A>, replacement: A) {

    return replaceRight(as, 2, replacement);
}


function replaceRight<A>(as: Array<A>, itemsToReplace: number, replacement: A) {

    return flow(as, dropRight(itemsToReplace), append([replacement]));
}


export const last = compose(takeRight(1), to('[0]'));