import {Observable} from 'rxjs/Observable';
import {ReadMediastore} from './read-mediastore';

/**
 * The interface for general media stores supporting
 * the storage of general binary data
 *
 * @author Sebastian Cuy
 */
export abstract class Mediastore extends ReadMediastore {

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    abstract create(key: string, data: ArrayBuffer): Promise<any>;

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    abstract update(key: string, data: ArrayBuffer): Promise<any>;

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
