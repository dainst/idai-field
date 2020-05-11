import {compose, filter, isDefined, keysAndValues, map, Map, to, values} from 'tsfun';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';


export const getDefinedParents = compose(
    values,
    map(to('parent')),
    filter(isDefined)
);


export function iterateOverFieldsOfCategories(categories: Map<TransientCategoryDefinition>,
                                              f: (categoryName: string, category: TransientCategoryDefinition,
                                                  fieldName: string, field: TransientFieldDefinition) => void) {

    keysAndValues(categories).forEach(([categoryName, category]) => {
        keysAndValues((category as any).fields).forEach(([fieldName, field]: any) => {
            f(categoryName, category as any, fieldName, field);
        })
    });
}