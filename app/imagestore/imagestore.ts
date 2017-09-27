import {ReadImagestore} from './read-imagestore';

/**
 * The interface for general media stores supporting
 * the storage of general binary data
 *
 * @author Sebastian Cuy
 */
export abstract class Imagestore extends ReadImagestore {

    abstract getPath(): string;

    /**
     * @param imagestorePath
     * @param projectName
     *   Rejects with
     *     [INVALID_PATH] - in case of invalid path
     */
    abstract setPath(imagestorePath: string, projectName: string): Promise<any>;

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @param documentExists
     * @returns {Promise<any>} resolve -> (),
     *   Rejects with
     *     [GENERIC_ERROR] - in case of error
     */
    abstract create(key: string, data: ArrayBuffer, documentExists?: boolean): Promise<any>;

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *    Rejects with
     *     [GENERIC_ERROR] - in case of error
     */
    abstract update(key: string, data: ArrayBuffer): Promise<any>;

    /**
     * @param key the identifier for the data to be removed
     * @returns {Promise<any>} resolve -> (),
     *   Rejects with
     *     [GENERIC_ERROR] - in case of error
     */
    abstract remove(key: string): Promise<any>;
}