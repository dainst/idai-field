/**
 * @author Thomas Kleinke
 */
export interface RollbackStrategy {


    /**
     *
     * @param resourceIds: Ids of the already imported resources
     */
    rollback(resourceIds: string[]): Promise<any>;
}