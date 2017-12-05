import {Document} from 'idai-components-2/core';

/**
 * @author Daniel de Oliveira
 */
export abstract class DocumentConverter {

    public abstract validateTypes(types: string[]|undefined, typeClass: string): string[]|undefined;

    public abstract convertToIdaiFieldDocument<T>(doc: Document): T;

    public abstract proveIsCorrectType(type: string, typeClass: string): void;
}
