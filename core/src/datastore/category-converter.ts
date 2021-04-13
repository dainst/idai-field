import {Document} from '../model/document';

/**
 * @author Daniel de Oliveira
 */
export abstract class CategoryConverter {

    public abstract convert(document: Document): Document;
}
