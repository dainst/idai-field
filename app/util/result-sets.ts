/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ResultSets {


    private addSets: Array<  // multiple result sets
        Array<            // a single result set
            Object // an element of a result set
        >> = [];

    private subtractSets: Array<Array<Object>> = [];


    public add(set: Array<Object>) {

        this.addSets.push(set);
    }


    public subtract(set: Array<Object>) {

        this.subtractSets.push(set);
    }


    /**
     * Finds the elements that are common to all sets. Elements from subtract sets are removed from the result.
     *
     * Assuming, one adds the two add sets
     *
     *   [{id:'1'}, {id:'2'}, {id:'3'}]
     *   [{id:'2'}, {id:'3'}]
     *
     *   and the subtract set
     *
     *   [{id:'3'}]
     *
     * intersect would return
     *
     *   [{id:'2'}] with f = a => a.id
     *
     * @param f gets applied to elements to get the field on which the comparison is performed
     */
    public intersect(f: Function): Array<Object> {

        let result: Array<Object> = this.addSets[0];

        for (let i = 1; i < this.addSets.length; i++) {
            result = result.filter(e => this.addSets[i].map(obj => f(obj)).indexOf(f(e)) != -1);
        }

        for (let set of this.subtractSets) {
            for (let object of set) {
                const index = result.map(obj =>f(obj)).indexOf(f(object));
                if (index > -1) result.splice(index, 1);
            }
        }

        return result;
    }


    /**
     * Returns a single result set which contains the objects of all add sets
     *
     *  Assuming, one adds the two sets
     *
     *   [{id:'1'}, {id:'2'}, {id:'3'}]
     *   [{id:'2'}, {id:'3'}]
     *
     * unify would return
     *
     *   [{id:'1'}, {id:'2'}, {id:'3'}] with f = a => a.id
     *
     * @param f gets applied to elements to get the field on which the comparison is performed
     */
    public unify(f: Function): Array<Object> {

        const result: any = {};

        for (let resultSet of this.addSets) {
            for (let item of resultSet) {
                result[f(item)] = item;
            }
        }

        return Object.keys(result).map(key => (result as any)[key]);
    }
}