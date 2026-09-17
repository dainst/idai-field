/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class Comparator {

    private collator: Intl.Collator;


    constructor(locale: string) {

        this.collator = new Intl.Collator(locale, { numeric: true });
    }


    /**
     * Compares two string alphanumerically so that
     * numerical portions of strings are treated as numbers.
     *
     * @param a a string
     * @param b another string
     * @returns {number} -1 if a < b, 1 if a > b, 0 if a == b
     */
    public alnumCompare(a: string, b: string): number {

        return this.collator.compare(a, b);
    }


    public numberCompare(a: number, b: number): number {

        if (a === undefined) a = 0;
        if (b === undefined) b = 0;

        if (a === b) {
            return 0;
        } else {
            return a > b ? 1 : -1;
        }
    }
}
