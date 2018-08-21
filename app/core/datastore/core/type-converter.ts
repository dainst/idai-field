import {Document} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export abstract class TypeConverter<T> {

    public abstract validateTypeToBeOfClass(types: string, typeClass: string): void;

    public abstract convert(doc: Document): T;

    public abstract getTypesForClass(typeClass: string): string[]|undefined;
}
