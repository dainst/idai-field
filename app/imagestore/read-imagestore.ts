/**
 * The interface for general media stores supporting
 * the storage of general binary data
 *
 * @author Sebastian Cuy
 */
export abstract class ReadImagestore {

    /**
     * @param key the identifier for the data
     * @returns {Promise<ArrayBuffer>} resolve -> (data), the data read with the key,
     *  reject -> the error message
     */
    abstract read(key: string,sanitizeAfter?:boolean): Promise<string>;
}