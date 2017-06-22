import {Observable} from 'rxjs/Observable';
import {ReadImagestore} from './read-imagestore';

/**
 * The interface for general media stores supporting
 * the storage of general binary data
 *
 * @author Sebastian Cuy
 */
export abstract class Imagestore extends ReadImagestore {

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

    abstract select(projectName: string): void;

}