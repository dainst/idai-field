import {Injectable} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {Document} from 'idai-components-2/core';
import {M} from '../../m';
import {Validations} from './validations';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(private projectConfiguration: ProjectConfiguration) {}

    /**
     * @param doc
     * @returns resolves with () or rejects with msgsWithParams
     */
    public validate(doc: Document): Promise<any> {

        let resource = doc.resource;

        if (!Validations.validateType(resource, this.projectConfiguration)) {
            return Promise.reject([M.VALIDATION_ERROR_INVALIDTYPE, resource.type]);
        }

        let missingProperties = Validations.getMissingProperties(resource, this.projectConfiguration);
        if (missingProperties.length > 0) {
            return Promise.reject([M.VALIDATION_ERROR_MISSINGPROPERTY, resource.type]
                .concat(missingProperties.join((', '))));
        }

        const invalidFields = Validations.validateFields(resource, this.projectConfiguration);
        if (invalidFields.length > 0) {
            const err = [invalidFields.length == 1 ?
                M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS];
            err.push(resource.type);
            err.push(invalidFields.join(', '));
            return Promise.reject(err);
        }

        const invalidRelationFields = Validations.validateRelations(resource, this.projectConfiguration);
        if (invalidRelationFields.length > 0) {
            const err = [invalidRelationFields.length == 1 ?
                M.VALIDATION_ERROR_INVALIDRELATIONFIELD :
                M.VALIDATION_ERROR_INVALIDRELATIONFIELDS];
            err.push(resource.type);
            err.push(invalidRelationFields.join(', '));
            return Promise.reject(err);
        }

        let invalidNumericValues;
        if (invalidNumericValues = Validations.validateNumericValues(resource, this.projectConfiguration)) {
            let err = [invalidNumericValues.length == 1 ?
                M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE :
                M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES];
            err.push(resource.type);
            err.push(invalidNumericValues.join(', '));
            return Promise.reject(err);
        }

        return this.validateCustom(doc);
    }

    /**
     * @throws msgsWithParams in case of validation error
     */
    protected async validateCustom(doc: Document): Promise<any> {}


    public async validateRelationTargets(document: Document, relationName: string): Promise<string[]> {

        return [];
    }
}