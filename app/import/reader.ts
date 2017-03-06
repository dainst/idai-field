
/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Daniel de Oliveira
 */
export interface Reader {

    /**
     * @returns {Promise<string>} resolves to content | rejects to msgWithParams in case of an error
     */
    read(): Promise<string>;
}