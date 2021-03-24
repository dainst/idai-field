import {compose, filter, isDefined, keysAndValues, map, Map, to} from 'tsfun';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';


export const getDefinedParents = compose(
    Object.values,
    map(to('parent')),
    filter(isDefined)
);


export function iterateOverFieldsOfCategories(categories: Map<TransientCategoryDefinition>,
                                              f: (categoryName: string, category: TransientCategoryDefinition,
                                                  fieldName: string, field: TransientFieldDefinition) => void) {

    keysAndValues(categories).forEach(([categoryName, category]) => {
        keysAndValues((category as any).fields).forEach(([fieldName, field]: any /* TODO review any*/) => {
            f(categoryName, category as any, fieldName, field);
        })
    });
}
