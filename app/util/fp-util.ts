/**
 * @author Daniel de Oliveira
 */
export class FPUtil {

    // implementation based on an idea taken from http://sufflavus.github.io/JS-Tips-Take-While
    public static takeWhile<A>(source: A[], predicate: (_: A) => boolean): A[] {

        let stopIndex = source.length;

        source.some((el: A, index: number) => {
            if (predicate(el)) return false;
            stopIndex = index;
            return true;
        });

        return source.slice(0, stopIndex);
    }


    public static takeUntil<A>(source: A[], predicate: (_: A) => boolean): A[] {

        let stopIndex = source.length;

        source.some((el: A, index: number) => {
            if (!predicate(el)) return false;
            stopIndex = index;
            return true;
        });

        return source.slice(0, stopIndex + 1);
    }
}