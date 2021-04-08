import {ReadImagestore} from './read-imagestore';
import {Settings} from '../../settings/settings';

/**
 * The interface for general media stores supporting
 * the storage of general binary data
 *
 * @author Sebastian Cuy
 */
export abstract class Imagestore extends ReadImagestore {


    abstract setDb_e2e(db: PouchDB.Database): void;


    abstract getPath(): string|undefined;


    /**
     * @param settings
     * Rejects with
     *   [INVALID_PATH] - in case of invalid path
     */
    abstract init(settings: Settings): Promise<any>;


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
     * @param options
     * @returns {Promise<any>} resolve -> (),
     *   Rejects with
     *     [GENERIC_ERROR] - in case of error
     */
    abstract remove(key: string, options?: { fs?: true }): Promise<any>;
}
