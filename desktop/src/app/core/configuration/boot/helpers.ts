import {compose, filter, isDefined, map, Map, to} from 'tsfun';
import {forEach} from 'tsfun/associative';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';


export const getDefinedParents = compose(
    Object.values,
    map(to('parent')),
    filter(isDefined)
);


export function iterateOverFieldsOfCategories(categories: Map<TransientCategoryDefinition>,
                                              f: (categoryName: string, category: TransientCategoryDefinition,
                                                  fieldName: string, field: TransientFieldDefinition) => void) {

    forEach(categories, (category, categoryName) => {
        forEach((category as any).fields, (field, fieldName: string) => {
            f(categoryName, category as any, fieldName, field);
        })
    });
}
