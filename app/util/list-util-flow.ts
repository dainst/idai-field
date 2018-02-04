/**
 * @author Daniel de Oliveira
 */


export const flow = <A>(...fs: Array<(_: Array<A>) => Array<A>>) =>
    (collection: Array<A>): Array<A> =>
        fs.reduce((acc, f) => f(acc), collection);


export const map = <A>(f: (_: A) => A) =>
    (as: Array<A>) => as.map(f);


export const filter = <A>(f: (_: A) => boolean) =>
    (as: Array<A>) => as.filter(f);


export const reverse = <A>(as: Array<A>) => as.reverse();


