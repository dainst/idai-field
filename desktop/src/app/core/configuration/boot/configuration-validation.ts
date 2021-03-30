import {ConfigurationErrors} from './configuration-errors';
import {ValuelistDefinition, CategoryDefinition, RelationDefinition} from 'idai-field-core';


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


    function validateFieldDefinitions__(categories: Array<CategoryDefinition>): Array<Array<string>> {

        let msgs = [] as any;

        for (let category of categories) {
            for (let fieldDef of category.fields) {
                if (!fieldDef.hasOwnProperty('name'))
                    msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGFIELDNAME, JSON.stringify(fieldDef)]);
                if (!fieldDef.hasOwnProperty('inputType'))
                    fieldDef.inputType = 'input';
                if (VALUELIST_INPUT_TYPES.indexOf(fieldDef.inputType) !== -1
                    && !fieldDef.valuelistFromProjectField
                    && !isValidValuelist(fieldDef.valuelist)) {
                    msgs.push([
                        ConfigurationErrors.INVALID_CONFIG_MISSINGVALUELIST,
                        fieldDef.name,
                        category.name
                    ]);
                }
                if (POSITION_VALUELIST_INPUT_TYPES.indexOf(fieldDef.inputType) !== -1
                    && !isValidValuelist(fieldDef.positionValues)) {
                    msgs.push([
                        ConfigurationErrors.INVALID_CONFIG_MISSINGPOSITIONVALUELIST,
                        fieldDef.name,
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
