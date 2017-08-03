/**
 * @author Daniel de Oliveira
 */
export class ResultSets {

    private sets: Array<  // multiple result sets
        Array<            // a single result set
            { id:string } // an element of a result set. Example: {id:'3',sortableField:'2017-01-03'};
        >> = [];

    /**
     * Example for sets:
     * [
     *   [{id:'1',sortableField:'2017-01-01'},{id:'2',sortableField:'2017-01-02'},{id:'3',sortableField:'2017-01-03'}],
     *   [{id:'2',sortableField:'2017-01-02'},{id:'3',sortableField:'2017-01-03'}]
     * ]
     */
    public set(sets: Array<Array<{ id: string }>>) {
        this.sets = sets;
    }

    public add(set: Array<{ id: string }>) {
        this.sets.push(set);
    }

    /**
     * Finds the elements that have ids common to all sets.
     * Sorts by element[sortOn] descending.
     *
     * Taking the example, intersect with sortOn = 'sortableField' would return
     * [{id:'3',sortableField:'2017-01-03'},{id:'2',sortableField:'2017-01-02'}]
     *
     * @param sortOn
     */
    public intersect(sortOn) {

        return this.sets.reduce((p,c) => {
            return p.filter(e => {
                return (c.map(r => r.id).indexOf(e.id)!=-1)
            })
        }).sort(this.comp(sortOn));
    }

    private comp(sortOn) {
        return ((a,b)=> {
            if (a[sortOn] > b[sortOn])
                return -1;
            if (a[sortOn] < b[sortOn])
                return 1;
            return 0;
        });
    }
}