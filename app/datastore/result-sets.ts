/**
 * @author Daniel de Oliveira
 */
export class ResultSets {

    private sets: Array<  // multiple result sets
        Array<            // a single result set
            Array<string> // an element of a result set. Example: ['3','2017-01-03']; [0] is an id, [1] is a date
        >>;

    constructor() {
        this.sets = [];
    }

    /**
     * Example for sets:
     * [
     *   [['1','2017-01-01'],['2',2017-01-02'],['3','2017-01-03']],
     *   [['2','2017-01-02'],['3','2017-01-03']]
     * ]
     */
    public set(sets: Array<Array<Array<string>>>) {
        this.sets = sets;
    }

    public add(set: Array<Array<string>>) {
        this.sets.push(set);
    }

    /**
     * Finds the elements that have ids common to all sets.
     * Sorts by element date descending.
     *
     * Taking the example, intersect would return
     * [['3','2017-01-03'],['2','2017-01-02']]
     */
    public intersect() {

        let rows = [];

        for (let result of this.sets) {
            let row = [];
            for (let column of result) {

                row.push(column)
            }
            rows.push(row)
        }

        return rows.reduce((p,c) => {
            return p.filter(e => {
                return c.map(r => r[0]).includes(e[0])
            })
        }).sort(ResultSets.comp);
    }

    private static comp(a,b) {
        if (a[1] > b[1])
            return -1;
        if (a[1] < b[1])
            return 1;
        return 0;
    }
}