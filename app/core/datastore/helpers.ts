import {append, compose, dropRight, flow, takeRight, to, take, drop, cond, len, is, val, last, first} from 'tsfun';
import {Document} from 'idai-components-2/src/model/core/document';


// @author Daniel de Oliveira

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


const lengthIs2 = compose(len, is(2));

/**
 * Gets the penultimate of an Array of A's, if it exists.
 * @returns A|undefined
 */
export const penultimate = compose(
    takeRight(2),
    cond(lengthIs2,
        first,
        val(undefined)));


export const ultimate = last;


/**
 * Dissociates the given indices from an array.
 *
 * Example
 *   > dissocIndices([0, 2])(['a', 'b', 'c', 'd')
 *   ['b', 'd']
 *
 * @param indices must be sorted in ascending order
 */
export function dissocIndices<A>(indices: number[]) { return (as: Array<A>): Array<A> => {

    const index = last(indices);
    return index === undefined
        ? as
        : dissocIndices
            (dropRight(1)(indices) as number[])
            (take(index)(as).concat(drop(index + 1)(as)) as Array<A>) as Array<A>;
}}