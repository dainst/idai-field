

// TODO transfer this apidoc to the corresponding places

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
// export abstract class UnusedIdaiFieldReadDatastore<T extends Document> extends ReadDatastore {

    /* find
     *
     * In addition to {@link Datastore#find}, {@link IdaiFieldReadDatastore#find}
     * has some extra specifications:
     *
     * The find method accepts the following constraints:
     *   resource.relations.isRecordedIn
     *   resource.relations.liesWithin
     *   resource.identifier
     *
     * Also, find returns the documents in order.
     * It sorts the objects by lastModified (as per the modified array) descending.
     * If two documents have the exact same lastModified, there is no second sort criterium
     * so the order between them is unspecified.
     */
    // public abstract find(query: Query):Promise<T[]>;