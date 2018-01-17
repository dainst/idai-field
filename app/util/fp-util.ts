/**
 * @author Daniel de Oliveira
 */

// implementation of takeWhile based on the idea taken from http://sufflavus.github.io/JS-Tips-Take-While
export const takeWhile = <A>(f: (_: A) => boolean) => (arr: A[]): A[] => {

    let stopIndex = arr.length;

    arr.some((el: A, index: number) => {
        if (f(el)) return false;
        stopIndex = index;
        return true;
    });

    return arr.slice(0, stopIndex);
};


export const takeUntil = <A>(f: (_: A) => boolean) => (arr: A[]): A[] => {

    let stopIndex = arr.length;

    arr.some((el: A, index: number) => {
        if (!f(el)) return false;
        stopIndex = index;
        return true;
    });

    return arr.slice(0, stopIndex + 1);
};


export const is = <A>(l:A) => (r:A) => l == r;


export const smaller = <A>(l:A) => (r:A) => l > r;


export const bigger = <A>(l:A) => (r:A) => l < r;


