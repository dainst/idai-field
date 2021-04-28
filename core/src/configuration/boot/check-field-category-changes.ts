import {filter, flow, forEach, isDefined, lookup, Map, map, on, to, assoc, values} from 'tsfun';
import {CustomFieldDefinition} from '../model/custom-category-definition';
import {TransientFieldDefinition} from '../model/transient-category-definition';


export function checkFieldCategoryChanges(customCategoryName: string,
                                          customCategoryFields: Map<CustomFieldDefinition>,
                                          extendedCategoryFields: Map<TransientFieldDefinition>) {

    flow(customCategoryFields,
        map((field: CustomFieldDefinition, fieldName: string) =>
            [customCategoryName, fieldName, field, lookup(extendedCategoryFields)(fieldName)]),
        filter(on([2, CustomFieldDefinition.INPUTTYPE], isDefined)),
        filter(on([3, CustomFieldDefinition.INPUTTYPE], isDefined)),
        map(assoc(2, to(CustomFieldDefinition.INPUTTYPE))),
        map(assoc(3, to(CustomFieldDefinition.INPUTTYPE))),
        values,
        forEach(checkFieldTypeChange));
}


function isAllowedCombination(l: string, r: string, a: string, b: string) {

    return (l === a && r === b) || (l === b && r === a);
}


function checkFieldTypeChange(
    [customCategoryName, fieldName, customFieldInputType, extendedFieldInputType]: [string, string, string, string]) {

    if (customFieldInputType === extendedFieldInputType) return;

    if (isAllowedCombination(customFieldInputType, extendedFieldInputType, 'checkboxes', 'input')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'input')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'checkboxes', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'input', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'checkboxes')) {

        console.warn('change of input type detected', customCategoryName, fieldName, customFieldInputType, extendedFieldInputType);
    } else {
        console.error('critical change of input type detected', customCategoryName, fieldName, customFieldInputType, extendedFieldInputType);
    }
}
