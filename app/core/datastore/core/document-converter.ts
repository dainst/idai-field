import {Document} from 'idai-components-2/core';

/**
 * @author Daniel de Oliveira
 */
export abstract class DocumentConverter {

    public abstract convertToIdaiFieldDocument<T>(
        doc: Document): T;


    public abstract proveIsCorrectType(doc: Document, typeClass: string): void;
}
