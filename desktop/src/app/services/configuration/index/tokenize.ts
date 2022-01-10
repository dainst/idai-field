import { flatten, isEmpty, not } from 'tsfun';


/**
 * @author Thomas Kleinke
 */
export function tokenize(terms: string[]) {

    return flatten(terms.map(tokenizeTerm));
}


function tokenizeTerm(term: string): string[] {

    return term.split(/[ \-_.:]/)
        .filter(not(isEmpty))
        .concat([term]);
}
