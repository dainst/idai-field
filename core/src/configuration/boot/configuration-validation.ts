import { Field, Relation, Valuelist } from '../../model';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { ConfigurationErrors } from './configuration-errors';


/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConfigurationValidation {

    export function findMissingRelationType(relations: Array<Relation>,
                                            categoryNames: string[]): Array<Array<string>> {

        let msgs: string[][] = [];

        function addMissingRelationCategories(rangeOrDomain: string[]|undefined) {
            if (!rangeOrDomain) return;
            for (let category of rangeOrDomain) {
                const categoryWithoutInheritanceSuffix = category.substring(
                    0, category.indexOf(':') !== -1
                        ? category.indexOf(':')
                        : undefined
                );
                if (categoryNames.indexOf(categoryWithoutInheritanceSuffix) === -1 && category !== 'Project') {
                    msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGRELATIONCATEGORY, category]);
                }
            }
        }

        if (relations) for (let relation of relations) {
            addMissingRelationCategories(relation.domain);
            addMissingRelationCategories(relation.range);
        }
        return msgs;
    }

    
    export function validateFieldDefinitions(forms: Array<TransientFormDefinition>): Array<Array<string>> {

        let messages: any[] = [];

        const errors = findInvalidFieldDefinitions(forms);
        if (errors.length) messages = messages.concat(errors);

        return messages;
    }


    function findInvalidFieldDefinitions(forms: Array<TransientFormDefinition>): Array<Array<string>> {

        const messages = [];

        for (let form of forms) {
            for (let fieldName of Object.keys(form.fields)) {
                const fieldDefinition = form.fields[fieldName];
                if (!fieldDefinition.hasOwnProperty('inputType')) fieldDefinition.inputType = 'input';
                if (Field.InputType.VALUELIST_INPUT_TYPES.indexOf(fieldDefinition.inputType as Field.InputType) !== -1
                    && !fieldDefinition.valuelistFromProjectField
                    && !isValidValuelist(fieldDefinition.valuelist)) {
                    messages.push([
                        ConfigurationErrors.INVALID_CONFIG_MISSINGVALUELIST,
                        fieldName,
                        form.name
                    ]);
                }
            }
        }

        return messages;
    }


    function isValidValuelist(valuelist: Valuelist|undefined): boolean {

        return valuelist
            && valuelist.values
            && Object.keys(valuelist.values).length > 0;
    }
}
