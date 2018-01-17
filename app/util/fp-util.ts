/**
 * @author Daniel de Oliveira
 */
export class FPUtil {

    // implementation based on an idea taken from http://sufflavus.github.io/JS-Tips-Take-While
    public static takeWhile = <A>(predicate: (_: A) => boolean) => (source: A[]): A[] => {

        let stopIndex = source.length;

        source.some((el: A, index: number) => {
            if (predicate(el)) return false;
            stopIndex = index;
            return true;
        });

        return source.slice(0, stopIndex);
    };


    public static takeUntil = <A>(predicate: (_: A) => boolean) => (source: A[]): A[] => {

        let stopIndex = source.length;

        source.some((el: A, index: number) => {
            if (!predicate(el)) return false;
            stopIndex = index;
            return true;
        });

        return source.slice(0, stopIndex + 1);
    };



}


export const is = <A>(l:A) => (r:A) => l == r;


