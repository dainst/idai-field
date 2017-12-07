export interface ResultSets {

    addSets: Array<  // multiple result sets
        Array<            // a single result set
            Object // an element of a result set
            >>,

    subtractSets: Array<Array<Object>>;
}

/**
 * Companion object
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ResultSets {

    private constructor() {} // hide on purpose to force usage of make or copy


    public static make(): ResultSets {

        return {
            addSets: [],
            subtractSets: []
        }
    }


    public static copy(resultSets: ResultSets): ResultSets {

        return JSON.parse(JSON.stringify(resultSets));
    }


    public static add(resultSets: ResultSets, set: Array<Object>): ResultSets {

        const copy = ResultSets.copy(resultSets);
        copy.addSets.push(set);
        return copy;
    }


    public static subtract(resultSets: ResultSets, set: Array<Object>): ResultSets {

        const copy = ResultSets.copy(resultSets);
        copy.subtractSets.push(set);
        return copy;
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
    public static intersect(resultSets: ResultSets, f: Function): Array<Object> {

        let result: Array<Object> = resultSets.addSets[0];

        for (let i = 1; i < resultSets.addSets.length; i++) {
            result = result.filter(e => resultSets.addSets[i].map(obj => f(obj)).indexOf(f(e)) != -1);
        }

        for (let set of resultSets.subtractSets) {
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
    public static unify(resultSets: ResultSets, f: Function): Array<Object> {

        const result: any = {};

        for (let resultSet of resultSets.addSets) {
            for (let item of resultSet) {
                result[f(item)] = item;
            }
        }

        return Object.keys(result).map(key => (result as any)[key]);
    }
}