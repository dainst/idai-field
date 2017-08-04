/**
 * @author Daniel de Oliveira
 */
export class ResultSets {

    private sets: Array<  // multiple result sets
        Array<            // a single result set
            Object // an element of a result set
        >> = [];

    public add(set: Array<Object>) {
        this.sets.push(set);
    }

    /**
     * Finds the elements that are common to all sets.
     *
     * Assuming, one adds the two sets
     *
     *   [{id:'1'},{id:'2'},{id:'3'}]
     *   [{id:'2'},{id:'3'}]
     *
     * intersect would return
     *
     *   [{id:'3'},{id:'2'}] with f = a => a.id
     *
     * @param f gets applied to elements
     *   to get an elements field on which the comparison
     *   is performed
     */
    public intersect(f) {

        return this.sets.reduce((p,c) =>
            p.filter(e =>
                c.map(r => f(r)).indexOf(f(e)) !=- 1
            )
        );
    }
}