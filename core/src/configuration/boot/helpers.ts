import { compose, filter, isDefined, keysValues, map, Map, to } from 'tsfun';
import { BaseCategoryDefinition, CustomFormDefinition } from '../model';
import { TransientFieldDefinition } from '../model/field/transient-field-definition';
import { TransientFormDefinition } from '../model/form/transient-form-definition';


export const getDefinedParents = compose(
    Object.values,
    map(to('parent')),
    filter(isDefined)
);


export function iterateOverFields(categories: Map<BaseCategoryDefinition|CustomFormDefinition|TransientFormDefinition>,
                                  f: (categoryName: string,
                                      category: BaseCategoryDefinition|CustomFormDefinition|TransientFormDefinition,
                                      fieldName: string, field: TransientFieldDefinition) => void) {

    keysValues(categories).forEach(([categoryName, category]) => {
        keysValues((category as any).fields).forEach(([fieldName, field]) => {
            f(categoryName, category as any, fieldName, field);
        })
    });
}
