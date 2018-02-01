import {Injectable} from '@angular/core';
import {ConfigLoader,
    ProjectConfiguration, FieldDefinition,
    RelationDefinition} from 'idai-components-2/configuration';
import {Document, Resource} from 'idai-components-2/core';
import {M} from '../../m';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(private configLoader: ConfigLoader) {}

    /**
     * @param doc
     * @returns resolves with () or rejects with msgsWithParams
     */
    public validate(doc: Document): Promise<any> {

        return (this.configLoader.getProjectConfiguration() as any).then((projectConfiguration: any) => {

            let resource = doc.resource;

            if (!Validator.validateType(resource, projectConfiguration)) {
                return Promise.reject([M.VALIDATION_ERROR_INVALIDTYPE, resource.type]);
            }

            let missingProperties = Validator.getMissingProperties(resource, projectConfiguration);
            if (missingProperties.length > 0) {
                return Promise.reject([M.VALIDATION_ERROR_MISSINGPROPERTY, resource.type]
                    .concat(missingProperties.join((', '))));
            }

            let invalidFields;
            if (invalidFields = Validator.validateFields(resource, projectConfiguration)) {
                let err = [invalidFields.length == 1 ?
                    M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS];
                err.push(resource.type);
                err.push(invalidFields.join(', '));
                return Promise.reject(err);
            }

            let invalidRelationFields;
            if (invalidRelationFields = Validator.validateRelations(resource, projectConfiguration)) {
                let err = [invalidRelationFields.length == 1 ?
                    M.VALIDATION_ERROR_INVALIDRELATIONFIELD :
                    M.VALIDATION_ERROR_INVALIDRELATIONFIELDS];
                err.push(resource.type);
                err.push(invalidRelationFields.join(', '));
                return Promise.reject(err);
            }

            let invalidNumericValues;
            if (invalidNumericValues = Validator.validateNumericValues(resource, projectConfiguration)) {
                let err = [invalidNumericValues.length == 1 ?
                    M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE :
                    M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES];
                err.push(resource.type);
                err.push(invalidNumericValues.join(', '));
                return Promise.reject(err);
            }

            return this.validateCustom(doc);
        });
    }

    /**
     * @param doc
     * @returns {Promise<void>} resolves with () or rejects with msgsWithParams in case of validation error
     */
    protected validateCustom(doc: Document): Promise<any> {

        return Promise.resolve();
    }

    private static getMissingProperties(resource: Resource, projectConfiguration: ProjectConfiguration) {

        const missingFields: string[] = [];
        const fieldDefinitions: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);

        for (let fieldDefinition of fieldDefinitions) {
            if (projectConfiguration.isMandatory(resource.type,fieldDefinition.name)) {
                if (resource[fieldDefinition.name] == undefined || resource[fieldDefinition.name] == '') {
                    missingFields.push(fieldDefinition.name);
                }
            }
        }

        return missingFields;
    }

    /**
     *
     * @param resource
     * @param projectConfiguration
     * @returns {boolean} true if the type of the resource is valid, otherwise false
     */
    private static validateType(resource: Resource, projectConfiguration: ProjectConfiguration): boolean {

        if (!resource.type) return false;
        return projectConfiguration.getTypesList()
            .some(type => type.name == resource.type);
    }

    /**
     *
     * @param resource
     * @param projectConfiguration
     * @returns {string[]} the names of invalid fields if one or more of the fields are invalid, otherwise
     * <code>undefined</code>
     */
    public static validateFields(resource: Resource, projectConfiguration: ProjectConfiguration): string[]|undefined {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const defaultFields: Array<FieldDefinition> = [{ name: 'relations' }];

        const fields: Array<any> = projectFields.concat(defaultFields);

        const invalidFields: Array<any> = [];

        for (let resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                let fieldFound: boolean = false;
                for (let i in fields) {
                    if (fields[i].name == resourceField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) {
                    invalidFields.push(resourceField);
                }
            }
        }

        return (invalidFields.length > 0) ? invalidFields : undefined;
    }

    /**
     * @returns {string[]} the names of invalid relation fields if one or more of the fields are invalid, otherwise
     * <code>undefined</code>
     */
    public static validateRelations(resource: Resource, projectConfiguration: ProjectConfiguration): string[]|undefined {

        const fields: Array<RelationDefinition> = projectConfiguration.getRelationDefinitions(resource.type) as any;
        const invalidFields: Array<any> = [];

        for (let relationField in resource.relations) {
            if (resource.relations.hasOwnProperty(relationField)) {
                let fieldFound: boolean = false;
                for (let i in fields) {
                    if (fields[i].name == relationField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) {
                    invalidFields.push(relationField);
                }
            }
        }

        return (invalidFields.length > 0) ? invalidFields : undefined;
    }


    public static validateNumericValues(resource: Resource, projectConfiguration: ProjectConfiguration): string[]|undefined {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const numericInputTypes: string[] = ['unsignedInt', 'float', 'unsignedFloat'];
        const invalidFields: string[] = [];

        for (let i in projectFields) {
            let fieldDef = projectFields[i] as any;

            if (fieldDef.hasOwnProperty('inputType')) {
                let value = resource[fieldDef.name];

                if (value && numericInputTypes.indexOf(fieldDef['inputType']) != -1) {
                    let valueIsValid = false;

                    if (fieldDef['inputType'] == 'unsignedInt') {
                        valueIsValid = value >>> 0 === parseFloat(value);
                    }

                    if (fieldDef['inputType'] == 'unsignedFloat') {
                        valueIsValid = 0 <= (value = parseFloat(value));
                    }
                    if (fieldDef['inputType'] == 'float') {
                        valueIsValid = !isNaN(value = parseFloat(value));
                    }

                    if (!valueIsValid) {
                        invalidFields.push(fieldDef.label as any);
                    }
                }
            }
        }

        return (invalidFields.length > 0) ? invalidFields : undefined;
    }
}