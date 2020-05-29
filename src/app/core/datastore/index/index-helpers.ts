

/**
 * Appends a new item 'a' at the end of a list 'as',
 * after first getting rid of all occurrences which existed in the list.
 * For performance reasons we use this instead of a more general
 * deduplication function because we focus just on the
 * uniqueness of our 'a' within the list.
 */
export function addUniquely<A>(as: Array<A>, a: A): Array<A> {

    return as.filter(_ => _ !== a).concat(a);
}
