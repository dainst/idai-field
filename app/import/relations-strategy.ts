/**
 * @author Thomas Kleinke
 */
export interface RelationsStrategy {

    /**
     *
     * @param resourceIds: Ids of the imported resources
     */
    completeInverseRelations(resourceIds: string[]): Promise<any>;

    /**
     *
     * @param resourceIds: Ids of the imported resources
     */
    resetInverseRelations(resourceIds: string[]): Promise<any>;
}