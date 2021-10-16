import { Map } from 'tsfun';
import { CategoryForm } from '../model/configuration/category-form';


export function getFieldsToIndex(categoriesMap: Map<CategoryForm>, categoryName: string): string[] {

    return !categoriesMap[categoryName]
        ? []
        : CategoryForm.getFields(categoriesMap[categoryName])
            .filter(field => field.fulltextIndexed)
            .map(field => field.name);
}
