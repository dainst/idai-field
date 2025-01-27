import { Constraint } from './constraint';


export type Constraints = { [name: string]: Constraint|string|string[] };

/**
 * represents a query to the datastore
 * @property q the query string that is used to search documents in the datastore
 * @property types restricts results to the given types
 * @property constraints restricts the search result further to match some fields.
 *   You can think of them as search terms that must be matched exactly. By default they are
 *   combined with each other and with the q term with AND, meaning that a search has to
 *   satisfy all the constraints (if defined) as well as to match q (at least partially) and
 *   type (if defined). A given constraint of
 *   { 'resource.relations.isRecordedIn': 'id1' } would mean that the search result
 *   contains the results which match the other properties of the query and which
 *   also match the given search term in the given field exactly.
 *   It is also possible to define negative constraints by using the Constraint interface and
 *   choosing the constraint type 'subtract':
 *   { 'resource.relations.isRecordedIn': { value: 'id1', subtract: true }
 * @property limit the number of documents to be returned. If there are more matching
 *   documents, only the first documents are returned.
 * @property offset
 * @property sort
 */
export interface Query {

    q?: string;
    categories?: string[];
    constraints?: Constraints;
    limit?: number;
    offset?: number;
    sort?: {
        mode?: 'default'|'exactMatchFirst'|'none',
        matchCategory?: string
    };
}


export module Query {

    export const SORT = 'sort';
    export const SORT_MODE_EXACTMATCHFIRST = 'exactMatchFirst';
    export const SORT_MATCHTYPE = 'matchType';

    export function isEmpty(query: Query) {

        return (!query.q || query.q == '') && !query.categories;
    }
}
