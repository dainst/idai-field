import {ConfigurationDefinition} from './configuration-definition';
import {CategoryDefinition} from '../model/category-definition';
import {RelationDefinition} from '../model/relation-definition';
import {ConfigurationErrors} from './configuration-errors';

/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConfigurationValidation {

    const VALUELIST_INPUT_TYPES = ['dropdown', 'radio', 'checkboxes'];


    export function findMissingRelationType(relations: Array<RelationDefinition>,
                                            categoryNames: string[]): Array<Array<string>> {

        let msgs = [] as any;

        function addMissingRelationCategories(rangeOrDomain: string[]|undefined) {
            if (!rangeOrDomain) return;
            for (let category of rangeOrDomain) {
                const categoryWithoutInheritanceSuffix = category.substring(
                    0, category.indexOf(':') !== -1
                        ? category.indexOf(':')
                        : undefined
                );
                if (categoryNames.indexOf(categoryWithoutInheritanceSuffix) === -1 && category !== 'Project') {
                    msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGRELATIONCATEGORY as never, category] as never);
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

        const fieldDefs: any = [].concat(...categories.map(category => category.fields));

        for (let fieldDef of fieldDefs) {
            if (!fieldDef.hasOwnProperty('name'))
                msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGFIELDNAME, JSON.stringify(fieldDef)]);
            if (!fieldDef.hasOwnProperty('inputType'))
                fieldDef.inputType = 'input';
            if (VALUELIST_INPUT_TYPES.indexOf(fieldDef.inputType) !== -1
                    && !fieldDef.hasOwnProperty('valuelistFromProjectField')
                    && (!fieldDef.hasOwnProperty('valuelist')
                        || !fieldDef.valuelist.values
                        || Object.keys(fieldDef.valuelist.values).length === 0
                )
            ) {
                msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGVALUELIST, fieldDef.name]);
            }
        }

        return msgs;
    }
}
