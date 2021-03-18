import {Document} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export abstract class CategoryConverter<T> {

    public abstract assertCategoryToBeOfClass(categories: string, categoryClass: string): void;

    public abstract convert(document: Document): T;

    public abstract getCategoriesForClass(categoryClass: string): string[]|undefined;
}
