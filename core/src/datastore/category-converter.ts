import {Document} from '../model/document';

/**
 * @author Daniel de Oliveira
 */
export abstract class CategoryConverter<T> {

    public abstract convert(document: Document): T;
}
