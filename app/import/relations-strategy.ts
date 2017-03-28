/**
 * @author Thomas Kleinke
 */
export interface RelationsStrategy {

    /**
     *
     * @param resourceIds: Ids of the imported resources
     */
    completeRelations(resourceIds: string[]): Promise<any>;

    /**
     *
     * @param resourceIds: Ids of the imported resources
     */
    resetRelations(resourceIds: string[]): Promise<any>;
}