import { RelationDefinition, ValuelistDefinition } from '../../model';
import {TransientCategoryDefinition} from '../model/transient-category-definition';
import { ConfigurationErrors } from './configuration-errors';


/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConfigurationValidation {

    const VALUELIST_INPUT_TYPES = ['dropdown', 'radio', 'checkboxes'];
    const POSITION_VALUELIST_INPUT_TYPES = ['dimension'];


    export function findMissingRelationType(relations: Array<RelationDefinition>,
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


    /**
     * Searches for missing mandatory categories or duplicate categories.
     * Returns on the first occurrence of either one.
     *
     * @returns {Array<string>} msgWithParams. undefined if no error.
     */
    export function validateFieldDefinitions(categories: any): Array<Array<string>> {

        let msgs: any[] = [];

        const fieldError = validateFieldDefinitions__(categories);
        if (fieldError.length) msgs = msgs.concat(fieldError);

        return msgs;
    }


    function validateFieldDefinitions__(categories: Array<TransientCategoryDefinition>): Array<Array<string>> {

        let msgs = [] as any;

        for (let category of categories) {
            for (let fieldName of Object.keys(category.fields)) {
                const fieldDefinition = category.fields[fieldName];
                if (!fieldDefinition.hasOwnProperty('inputType'))
                fieldDefinition.inputType = 'input';
                if (VALUELIST_INPUT_TYPES.indexOf(fieldDefinition.inputType) !== -1
                    && !fieldDefinition.valuelistFromProjectField
                    && !isValidValuelist(fieldDefinition.valuelist)) {
                    msgs.push([
                        ConfigurationErrors.INVALID_CONFIG_MISSINGVALUELIST,
                        fieldName,
                        category.name
                    ]);
                }
                if (POSITION_VALUELIST_INPUT_TYPES.indexOf(fieldDefinition.inputType) !== -1
                    && !isValidValuelist((fieldDefinition as any).positionValues)) {
                    msgs.push([
                        ConfigurationErrors.INVALID_CONFIG_MISSINGPOSITIONVALUELIST,
                        fieldName,
                        category.name
                    ]);
                }
            }
        }

        return msgs;
    }


    function isValidValuelist(valuelist: ValuelistDefinition|undefined): boolean {

        return valuelist
            && valuelist.values
            && Object.keys(valuelist.values).length > 0;
    }
}
