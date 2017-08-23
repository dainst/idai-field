/**
 * Implements utility methods for sorting strings alphanumerically so that
 * numerical portions of strings are treated as numbers.
 *
 * @author Sebastian Cuy
 */
export class AlnumSortUtil {

    /**
     * Compares two string alphanumerically
     * @param a a string
     * @param b another string
     * @returns {number} -1 if a < b, 1 if a > b, 0 if a == b
     */
    public static compare(a, b): number {

        let arrayA = this.makeAlNumArray(a);
        let arrayB = this.makeAlNumArray(b);

        for (let i=0; i < arrayA.length; i++) {
            // a is longer than b
            if (i >= arrayB.length) return 1;
            if (typeof arrayA[i] == 'number') {
                // both elements are numbers
                if (typeof arrayB[i] == 'number') {
                    if (arrayA[i] > arrayB[i]) return 1;
                    if (arrayA[i] < arrayB[i]) return -1;
                // a is number, b is string
                } else {
                    return -1;
                }
            } else {
                // both elements are strings
                if (typeof arrayB[i] == 'string') {
                    let cmp =  arrayA[i].localeCompare(arrayB[i]);
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

    // split string and convert numbers to be able to sort alphabetic
    // and numeric parts of the string separately
    private static makeAlNumArray(s) {
        return s.split(/(\d+)/)
            .map(s => /^\d+$/.test(s) ? parseInt(s) : s);
    }

}