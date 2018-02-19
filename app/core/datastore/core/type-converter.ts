import {Document} from 'idai-components-2/core';

/**
 * @author Daniel de Oliveira
 */
export abstract class TypeConverter<T> {

    public abstract validate(types: string[]|undefined, typeClass: string): string[]|undefined;

    public abstract convert(doc: Document): T;
}
