import { Map } from 'tsfun';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model';


export function getFieldsToIndex(categoryForm: CategoryForm): Array<Field> {

    return !categoryForm
        ? []
        : CategoryForm.getFields(categoryForm)
            .filter(field => field.fulltextIndexed);
}
