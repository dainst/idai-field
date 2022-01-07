import { flatten, keysValues, right, set } from 'tsfun';
import { Valuelist } from 'idai-field-core';
import { tokenize } from './tokenize';


export interface ValuelistIndex {

    [term: string]: Array<Valuelist>;
}


/**
 * @author Thomas Kleinke
 */
export namespace ValuelistIndex {

    export function create(valuelists: Array<Valuelist>): ValuelistIndex {

        return valuelists.reduce((index, valuelist) => {
            const terms: string[] = getTerms(valuelist);
    
            for (const term of terms) {
                if (!index[term]) index[term] = [];
                if (!index[term].includes(valuelist)) index[term].push(valuelist);
            }   
            return index;
        }, {});
    }


    export function find(index: ValuelistIndex, searchTerm: string): Array<Valuelist> {

        return set(flatten(keysValues(index)
            .filter(([term, _]) => term.toLocaleLowerCase().startsWith(searchTerm.toLowerCase()))
            .map(right)
        ));
    }


    function getTerms(valuelist: Valuelist): string[] {

        return tokenize(
            [valuelist.id].concat(Object.keys(valuelist.values))
                .concat(flatten(
                    Object.values(valuelist.values).map(value => value.label ? Object.values(value.label) : [])
                ))
        );
    }
}
