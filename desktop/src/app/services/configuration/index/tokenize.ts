import { flatten, isEmpty, not } from 'tsfun';


/**
 * @author Thomas Kleinke
 */
export function tokenize(terms: string[], keepOriginal: boolean = true) {

    return flatten(terms.map(term => tokenizeTerm(term, keepOriginal)));
}


function tokenizeTerm(term: string, keepOriginal: boolean): string[] {

    const result = term.split(/[ \-_.:]/)
        .filter(not(isEmpty));
    
    return keepOriginal || result.length === 0
        ? result.concat([term])
        : result;
}
