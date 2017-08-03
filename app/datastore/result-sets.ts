/**
 * @author Daniel de Oliveira
 */
export class ResultSets {

    private sets;

    constructor() {
        this.sets = [];
    }

    /**
     * Example for sets:
     * [
     *   [['1','2017-01-01'],['2',2017-01-02']],
     *   [['2','2017-01-02']]
     * ]
     */
    public set(sets: Array<Array<Array<string>>>) {
        this.sets = sets;
    }

    public add(set: Array<Array<string>>) {
        this.sets.push(set);
    }

    /**
     * Sorts by date descending
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