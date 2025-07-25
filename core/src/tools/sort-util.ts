/**
 * Implements utility methods for sorting
 *
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export module SortUtil {

    /**
     * Compares two string alphanumerically so that
     * numerical portions of strings are treated as numbers.
     *
     * @param a a string
     * @param b another string
     * @returns {number} -1 if a < b, 1 if a > b, 0 if a == b
     */
    export function alnumCompare(a: string, b: string): number {

        const arrayA = makeAlNumArray(a);
        const arrayB = makeAlNumArray(b);

        for (let i = 0; i < arrayA.length; i++) {
            // a is longer than b
            if (i >= arrayB.length) return 1;
            if (typeof arrayA[i] === 'number') {
                // both elements are numbers
                if (typeof arrayB[i] === 'number') {
                    if (arrayA[i] > arrayB[i]) return 1;
                    if (arrayA[i] < arrayB[i]) return -1;
                // a is number, b is string
                } else {
                    return -1;
                }
            } else {
                // both elements are strings
                if (typeof arrayB[i] === 'string') {
                    let cmp = arrayA[i].localeCompare(arrayB[i]);
                    if (cmp > 0) return 1;
                    if (cmp < 0) return -1;
                // a is string b is number
                } else {
                    return 1;
                }
            }
            // so far, a and b are equal -> continue with next array element
        }
        // b is longer than a
        if (arrayB.length > arrayA.length) return -1;
        // a and b are equal
        return 0;
    }


    export function numberCompare(a: number, b: number): number {

        if (a === undefined) a = 0;
        if (b === undefined) b = 0;

        if (a === b) {
            return 0;
        } else {
            return a > b ? 1 : -1;
        }
    }


    // split string and convert numbers to be able to sort alphabetic
    // and numeric parts of the string separately
    function makeAlNumArray(s: any) {

        return s
            .split(/(\d+)/)
            .map((s: any) => isNaN(s) ? s : parseInt(s));
    }
}
