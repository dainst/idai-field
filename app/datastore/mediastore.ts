import {Observable} from "rxjs/Observable";

/**
 * The interface for general media stores supporting
 * the storage of general binary data
 *
 * @author Sebastian Cuy
 */
export abstract class Mediastore {

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    abstract create(key: string, data: any): Promise<any>;

    /**
     * @param key the identifier for the data
     * @returns {Promise<any>} resolve -> (data), the data read with the key,
     *  reject -> the error message
     */
    abstract read(key: string): Promise<any>;

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    abstract update(key: string, data: any): Promise<any>;

    /**
     * @param key the identifier for the data to be removed
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    abstract remove(key: string): Promise<any>;

    /**
     * Subscription enables clients to get notified
     * when files get modified via one of the accessor
     * methods defined here.
     */
    abstract objectChangesNotifications(): Observable<File>;

}
