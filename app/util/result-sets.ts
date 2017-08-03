/**
 * @author Daniel de Oliveira
 */
export class ResultSets {

    /**
     * Example for sets:
     * [
     *   [{id:'1'},{id:'2'},{id:'3'}],
     *   [{id:'2'},{id:'3'}]
     * ]
     */
    private sets: Array<  // multiple result sets
        Array<            // a single result set
            { } // an element of a result set.
        >> = [];

    public add(set: Array<{ id: string }>) {
        this.sets.push(set);
    }

    /**
     * Finds the elements that have ids common to all sets.
     *
     * Taking the example, intersect with field = 'id' would return
     * [{id:'3'},{id:'2'}]
     *
     * @param field
     */
    public intersect(field) {

        return this.sets.reduce((p,c) => {
            return p.filter(e => {
                return (c.map(r => r[field]).indexOf(e[field])!=-1)
            })
        });
    }
}