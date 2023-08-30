import { Map } from 'tsfun';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model';


export function getFieldsToIndex(categoriesMap: Map<CategoryForm>, categoryName: string): Array<Field> {

    return !categoriesMap[categoryName]
        ? []
        : CategoryForm.getFields(categoriesMap[categoryName])
            .filter(field => field.fulltextIndexed);
}
