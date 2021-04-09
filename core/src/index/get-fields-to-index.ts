import { Map } from 'tsfun';
import { Category } from '../model/category';


const defaultFieldsToIndex = ['identifier', 'shortDescription'];


export function getFieldsToIndex(categoriesMap: Map<Category>, categoryName: string): string[] {

    const fields = !categoriesMap[categoryName]
        ? []
        : Category.getFields(categoriesMap[categoryName])
            .filter(field => field.fulltextIndexed)
            .map(field => field.name);
    return fields.concat(defaultFieldsToIndex);
}
