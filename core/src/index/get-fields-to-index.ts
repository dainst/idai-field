import { Map } from 'tsfun';
import { Category } from '../model';


export function getFieldsToIndex(categoriesMap: Map<Category>, categoryName: string): string[] {

    return !categoriesMap[categoryName]
        ? []
        : Category.getFields(categoriesMap[categoryName])
            .filter(field => field.fulltextIndexed)
            .map(field => field.name);
}
