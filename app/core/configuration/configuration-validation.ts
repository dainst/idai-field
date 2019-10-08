import {ConfigurationDefinition} from './configuration-definition';
import {TypeDefinition} from './model/type-definition';
import {RelationDefinition} from './model/relation-definition';
import {ConfigurationErrors} from './configuration-errors';

/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConfigurationValidation {

    const VALUELIST_INPUT_TYPES = ['dropdown', 'radio', 'checkboxes'];


    export function findMissingRelationType(relations: Array<RelationDefinition>,
                                          types: string[]): Array<Array<string>> {

        let msgs = [] as any;

        function addMissingRelTypes(rangeOrDomain: string[]|undefined) {
            if (!rangeOrDomain) return;
            for (let type of rangeOrDomain) {
                const typeWithoutInheritanceSuffix = type.substring(0, type.indexOf(':') !== -1 ? type.indexOf(':') : undefined);
                if (types.indexOf(typeWithoutInheritanceSuffix) === -1 && type !== 'Project') {
                    msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGRELATIONTYPE as never, type] as never);
                }
            }
        }

        if (relations) for (let relation of relations) {
            addMissingRelTypes(relation.domain);
            addMissingRelTypes(relation.range);
        }
        return msgs;
    }


    /**
     * Searches for missing mandatory types or duplicate types.
     * Returns on the first occurrence of either one.
     *
     * @param configuration
     * @returns {Array<string>} msgWithParams. undefined if no error.
     */
    export function validateFieldDefinitions(configuration: ConfigurationDefinition): Array<Array<string>> {

        let msgs: any[] = [];

        const fieldError = validateFieldDefinitions__(configuration.types);
        if (fieldError.length) msgs = msgs.concat(fieldError);

        return msgs;
    }


    function validateFieldDefinitions__(types: Array<TypeDefinition>): Array<Array<string>> {

        let msgs = [] as any;

        const fieldDefs: any = [].concat(...types.map(type => type.fields));

        for (let fieldDef of fieldDefs) {
            if (!fieldDef.hasOwnProperty('name'))
                msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGFIELDNAME, JSON.stringify(fieldDef)] as never);
            if (!fieldDef.hasOwnProperty('inputType'))
                fieldDef.inputType = 'input';
            if (VALUELIST_INPUT_TYPES.indexOf(fieldDef.inputType) !== -1
                    && !fieldDef.hasOwnProperty('valuelistFromProjectField')
                    && (!fieldDef.hasOwnProperty('valuelist')
                        || !Array.isArray(fieldDef.valuelist)
                        || fieldDef.valuelist.length == 0
                )
            ) {
                msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGVALUELIST, fieldDef.name] as never);
            }
        }

        return msgs;
    }
}
