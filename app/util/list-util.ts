/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */

// TODO put to tsfun

export const getAtIndex = <A>(as: Array<A>, i: number): A|undefined => getAtIndexOr(as, i);


export const getAtIndexOr = <A>(as: Array<A>, i: number, defaultValue: A|undefined = undefined): A|undefined =>
    as.length < i ? defaultValue : as[i];