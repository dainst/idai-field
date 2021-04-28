import {compose, filter, isDefined, keysValues, map, Map, to} from 'tsfun';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';


export const getDefinedParents = compose(
    Object.values,
    map(to('parent')),
    filter(isDefined)
);


export function iterateOverFieldsOfCategories(categories: Map<TransientCategoryDefinition>,
                                              f: (categoryName: string, category: TransientCategoryDefinition,
                                                  fieldName: string, field: TransientFieldDefinition) => void) {

    keysValues(categories).forEach(([categoryName, category]) => {
        keysValues((category as any).fields).forEach(([fieldName, field]) => {
            f(categoryName, category as any, fieldName, field);
        })
    });
}
