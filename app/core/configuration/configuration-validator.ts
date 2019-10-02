import {ConfigurationDefinition} from './configuration-definition';
import {TypeDefinition} from 'idai-components-2';
import {RelationDefinition} from 'idai-components-2';
import {ConfigurationErrors} from './configuration-errors';

/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConfigurationValidator {

    private static VALID_INPUT_TYPES = [
        'input', 'text', 'dropdown', 'dropdownRange', 'radio', 'checkboxes', 'unsignedInt', 'float',
        'unsignedFloat', 'dating', 'dimension', 'boolean', 'date'
    ];
    private static VALUELIST_INPUT_TYPES = ['dropdown', 'radio', 'checkboxes'];


    /**
     * Searches for missing mandatory types or duplicate types.
     * Returns on the first occurrence of either one.
     *
     * @param configuration
     * @returns {Array<string>} msgWithParams. undefined if no error.
     */
    public go(configuration: ConfigurationDefinition): Array<Array<string>> {

        let msgs: any[] = [];

        const invalidTypeErrors = ConfigurationValidator.findInvalidType(configuration.types);
        if (invalidTypeErrors) msgs = msgs.concat(invalidTypeErrors);

        const duplicateTypeErrors = ConfigurationValidator.findDuplicateType(configuration.types);
        if (duplicateTypeErrors) msgs = msgs.concat(duplicateTypeErrors);

        const missingParentTypeErrors = ConfigurationValidator.findMissingParentType(configuration.types);
        if (missingParentTypeErrors) msgs = msgs.concat(missingParentTypeErrors);

        const missingRelationTypeErrors = ConfigurationValidator.findMissingRelationType(configuration.relations as any, configuration.types);
        if (missingRelationTypeErrors) msgs = msgs.concat(missingRelationTypeErrors);

        const fieldError = ConfigurationValidator.validateFieldDefinitions(configuration.types);
        if (fieldError.length) msgs = msgs.concat(fieldError);

        return msgs.concat(this.custom(configuration));
    }


    protected custom(configuration: ConfigurationDefinition): any[] {

        return [];
    }


    /**
     * Check if all necessary fields are given and have the right type
     * (Might be refactored to use some kind of runtime type checking)
     *
     * @param types
     * @returns {string} invalidType. undefined if no error.
     */
    private static findInvalidType(types: Array<TypeDefinition>): Array<Array<string>> {

        return types
            .filter(type => !type.type || !(typeof type.type == 'string'))
            .reduce(this.addErrMsg(this.invalidType), [])
    }


    private static findDuplicateType(types: Array<TypeDefinition>): Array<Array<string>> {

        let o: any = {};

        return types
            .filter(type => {
                if (o[type.type]) return true;
                o[type.type] = true; return false;
            })
            .reduce(this.addErrMsg(this.duplicateType), []);
    }


    private static findMissingParentType(types: Array<TypeDefinition>): Array<Array<string>> {

        return types
            .filter(type =>
                type.parent &&
                types.map(type => type.type).indexOf(type.parent) == -1)
            .reduce(this.addErrMsg(this.missingParentType), []);
    }


    private static addErrMsg = (errFun: Function) =>
        (msgs: Array<Array<string>>, type: TypeDefinition) => {
            msgs.push(errFun(type));
            return msgs;
        };


    private static missingParentType = (type: TypeDefinition) =>
        [ConfigurationErrors.INVALID_CONFIG_MISSINGPARENTTYPE, type.parent];


    private static duplicateType = (type: TypeDefinition) =>
        [ConfigurationErrors.INVALID_CONFIG_DUPLICATETYPE, type.type];

    private static multipleUseOfDating = (type: TypeDefinition) =>
        [ConfigurationErrors.INVALID_CONFIG_MULTIPLEUSEOFDATING, type.type];

    private static invalidType = (type: TypeDefinition) =>
        [ConfigurationErrors.INVALID_CONFIG_INVALIDTYPE, JSON.stringify(type)];


    private static findMissingRelationType(relations: Array<RelationDefinition>,
                                           types: Array<TypeDefinition>): Array<Array<string>> {

        let msgs = [] as any;
        const typeNames: Array<string> = types.map(type => type.type);

        if (relations) for (let relation of relations) {
            for (let type of relation.domain)
                if (typeNames.indexOf(type) == -1)
                    msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGRELATIONTYPE as never, type] as never);
            for (let type of relation.range)
                if (typeNames.indexOf(type) == -1 && type != 'Project')
                    msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGRELATIONTYPE, type] as never);
        }

        return msgs;
    }


    private static validateFieldDefinitions(types: Array<TypeDefinition>): Array<Array<string>> {

        let msgs = [] as any;

        const fieldDefs: any = [].concat(...types.map(type => type.fields));

        for (let fieldDef of fieldDefs) {
            if (!fieldDef.hasOwnProperty('name'))
                msgs.push([ConfigurationErrors.INVALID_CONFIG_MISSINGFIELDNAME, JSON.stringify(fieldDef)] as never);
            if (!fieldDef.hasOwnProperty('inputType'))
                fieldDef.inputType = 'input';
            if (ConfigurationValidator.VALID_INPUT_TYPES.indexOf(fieldDef.inputType) == -1)
                msgs.push([ConfigurationErrors.VALIDATION_ERROR_INVALIDINPUTTYPE, fieldDef.name,
                    fieldDef.inputType, ConfigurationValidator.VALID_INPUT_TYPES.join(', ')] as never);
            if (ConfigurationValidator.VALUELIST_INPUT_TYPES.indexOf(fieldDef.inputType) != -1
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