import { append, compose, dropRight, flow, takeRight, take, drop, cond, size, isnt, last, throws} from 'tsfun';
import { Document } from '../model/document/document';


/**
 * @author Daniel de Oliveira
 */

export function isProjectDocument(document: Document): boolean {

    return document.resource.id === 'project';
}


export function sortRevisionsByLastModified(documents: Array<Document>): Array<Document> {

    return documents.sort((l: Document, r: Document) => {
        const lDate = Document.getLastModified(l).date as Date;
        const rDate = Document.getLastModified(r).date as Date;
        if (lDate < rDate) return -1;
        if (lDate > rDate) return 1;
        return 0;
    });
}


export function replaceLastPair<A>(as: Array<A>, replacement: A): Array<A> {

    return replaceRight(as, 2, replacement);
}


function replaceRight<A>(as: Array<A>, itemsToReplace: number, replacement: A): Array<A> {

    return flow(as, dropRight(itemsToReplace), append(replacement));
}


const lengthIsnt2 = compose(size, isnt(2));


export const last2 = compose(
    takeRight(2),
    cond(lengthIsnt2, throws('Illegal argument, length must be at least 2')));


/**
 * Dissociates the given indices from an array.
 *
 * Example
 *   > dissocIndices([0, 2])(['a', 'b', 'c', 'd')
 *   ['b', 'd']
 *
 * @param indices must be sorted in ascending order
 */
export function dissocIndices<A>(indices: Array<number>) {

    return (as: Array<A>): Array<A> => {

        const index = last(indices);
        if (index === undefined) return as;

        return dissocIndices
                (dropRight(1, indices))
                (
                  take(index, as)
                  .concat(
                      drop(index + 1, as)
                  )
                ) as Array<A>;
    }
}
