import {Injectable} from '@angular/core';
import {ConfigLoader, ProjectConfiguration, FieldDefinition,
    RelationDefinition} from 'idai-components-2/configuration';
import {Document, Resource} from 'idai-components-2/core';
import {M} from '../../m';
import {validateFloat, validateUnsignedFloat, validateUnsignedInt} from '../../util/number-util';


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

            const invalidFields = Validator.validateFields(resource, projectConfiguration);
            if (invalidFields.length > 0) {
                const err = [invalidFields.length == 1 ?
                    M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS];
                err.push(resource.type);
                err.push(invalidFields.join(', '));
                return Promise.reject(err);
            }

            const invalidRelationFields = Validator.validateRelations(resource, projectConfiguration);
            if (invalidRelationFields.length > 0) {
                const err = [invalidRelationFields.length == 1 ?
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


    public static validateFields(resource: Resource, projectConfiguration: ProjectConfiguration): Array<string> {

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

        return (invalidFields.length > 0) ? invalidFields : [];
    }


    /**
     * @returns {string[]} the names of invalid relation fields if one or more of the fields are invalid, otherwise
     * <code>undefined</code>
     */
    public static validateRelations(resource: Resource, projectConfiguration: ProjectConfiguration): string[] {

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

        return (invalidFields.length > 0) ? invalidFields : [];
    }


    public static validateNumericValues(resource: Resource, projectConfiguration: ProjectConfiguration): string[]|undefined {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const numericInputTypes: string[] = ['unsignedInt', 'float', 'unsignedFloat'];
        const invalidFields: string[] = [];

        projectFields.filter(fieldDefinition => {
            return fieldDefinition.inputType && numericInputTypes.includes(fieldDefinition.inputType)
        }).forEach(fieldDefinition => {
            let value = resource[fieldDefinition.name];

            if (value && numericInputTypes.includes(fieldDefinition.inputType as string)
                    && !Validator.validateNumber(value, fieldDefinition.inputType as string)) {
                invalidFields.push(fieldDefinition.label as any);
            }
        });

        return (invalidFields.length > 0) ? invalidFields : undefined;
    }


    private static validateNumber(value: string, inputType: string): boolean {

        switch(inputType) {
            case 'unsignedInt':
                return validateUnsignedInt(value);
            case 'float':
                return validateFloat(value);
            case 'unsignedFloat':
                return validateUnsignedFloat(value);
            default:
                return false;
        }
    }


    // TODO get rid of this when validator classes are merged
    public async validateRelationTargets(document: Document, relationName: string): Promise<string[]> {

        return [];
    }
}