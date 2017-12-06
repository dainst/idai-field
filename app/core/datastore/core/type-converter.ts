import {Document} from 'idai-components-2/core';

/**
 * @author Daniel de Oliveira
 */
export abstract class TypeConverter {

    public abstract validate(types: string[]|undefined, typeClass: string): string[]|undefined;

    public abstract convert<T>(doc: Document): T;
}
