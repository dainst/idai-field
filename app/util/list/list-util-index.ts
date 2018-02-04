/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */

export const getAtIndex = <A>(as: Array<A>, i: number): A|undefined => getAtIndexOr(as, i);


export const getAtIndexOr = <A>(as: Array<A>, i: number, defaultValue: A|undefined = undefined): A|undefined =>
    as.length < i ? defaultValue : as[i];


export const removeAtIndex = <A>(as: Array<A>) => (i: number) => as.splice(i, 1);