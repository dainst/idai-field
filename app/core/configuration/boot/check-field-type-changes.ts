import {filter, flow, forEach, isDefined, lookup, map, Map, on, to, update} from 'tsfun';
import {CustomFieldDefinition} from '../model/custom-type-definition';
import {TransientFieldDefinition} from '../model/transient-type-definition';


export function checkFieldTypeChanges(customTypeName: string,
                                      customTypeFields: Map<CustomFieldDefinition>,
                                      extendedTypeFields: Map<TransientFieldDefinition>) {

    flow(customTypeFields,
        map((field: CustomFieldDefinition, fieldName: string) =>
            [customTypeName, fieldName, field, lookup(extendedTypeFields)(fieldName)]),
        filter(on('[2].' + CustomFieldDefinition.INPUTTYPE, isDefined)),
        filter(on('[3].' + CustomFieldDefinition.INPUTTYPE, isDefined)),
        map(update(2, to(CustomFieldDefinition.INPUTTYPE))),
        map(update(3, to(CustomFieldDefinition.INPUTTYPE))),
        forEach(checkFieldTypeChange));
}


function isAllowedCombination(l: string, r: string, a: string, b: string) {

    return (l === a && r === b) || (l === b && r === a);
}


function checkFieldTypeChange(
    [customTypeName, fieldName, customFieldInputType, extendedFieldInputType]: [string, string, string, string]) {

    if (customFieldInputType === extendedFieldInputType) return;

    if (isAllowedCombination(customFieldInputType, extendedFieldInputType, 'checkboxes', 'input')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'input')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'checkboxes', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'input', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'checkboxes')) {

        console.warn('change of input type detected', customTypeName, fieldName, customFieldInputType, extendedFieldInputType);
    } else {
        console.error('critical change of input type detected', customTypeName, fieldName, customFieldInputType, extendedFieldInputType);
    }
}
