import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';
import {TypeUtility} from '../model/type-utility';
import {Validator} from '../model/validator';
import {Validations} from '../model/validations';
import {ValidationErrors} from '../model/validation-errors';
import {ImportErrors} from './import-errors';


@Injectable()
/**
 * Validates against data model of ProjectConfiguration and TypeUtility and contents of Database
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImportValidator extends Validator {

    constructor(projectConfiguration: ProjectConfiguration,
                datastore: IdaiFieldDocumentDatastore,
                typeUtility: TypeUtility) {

        super(projectConfiguration, datastore, typeUtility);
    }


    /**
     * @throws [INVALID_TYPE]
     */
    public assertIsKnownType(document: Document|NewDocument) {

        if (!Validations.validateType(document.resource, this.projectConfiguration)) {
            throw [ValidationErrors.INVALID_TYPE, document.resource.type];
        }
    }


    public assertIsAllowedType(document: Document|NewDocument, mergeMode: boolean) {

        if (document.resource.type === 'Operation'
            || document.resource.type === 'Project') {

            throw [ImportErrors.TYPE_NOT_ALLOWED, document.resource.type];
        }

        if (!mergeMode && (document.resource.type === 'Image'
            || this.typeUtility.isSubtype(document.resource.type, 'Image'))) {

            throw [ImportErrors.TYPE_ONLY_ALLOWED_ON_UPDATE, document.resource.type];
        }
    }


    /**
     * Wellformedness test specifically written for use in import package.
     *
     * Assumes
     *   * that the type of the document is a valid type from the active ProjectConfiguration
     *
     * Asserts
     *   * the fields and relations defined in a given document are actually configured
     *     fields and relations for the type of resource defined.
     *   * that the geometries are structurally valid
     *   * there are no mandatory fields missing
     *   * the numerical values are correct
     *
     * Does not do anything database consistency related,
     *   e.g. checking identifier uniqueness or relation target existence.
     *
     * @throws ValidationErrors.*
     * @throws [INVALID_RELATIONS]
     * @throws [INVALID_FIELDS]
     * @throws [MISSING_PROPERTY]
     * @throws [MISSING_GEOMETRYTYPE]
     * @throws [MISSING_COORDINATES]
     * @throws [UNSUPPORTED_GEOMETRY_TYPE]
     * @throws [INVALID_COORDINATES]
     * @throws [INVALID_NUMERICAL_VALUE]
     */
    public assertIsWellformed(document: Document|NewDocument): void {

        const invalidFields = Validations.validateDefinedFields(document.resource, this.projectConfiguration);
        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_FIELDS,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }

        const invalidRelationFields = Validations
            .validateDefinedRelations(document.resource, this.projectConfiguration)
            // operations have empty isRecordedIn which however is not defined. image types must not be imported. regular types all have isRecordedIn
            .filter(item => item !== 'isRecordedIn');
        if (invalidRelationFields.length > 0) {
            throw [
                ValidationErrors.INVALID_RELATIONS,
                document.resource.type,
                invalidRelationFields.join(', ')
            ];
        }

        Validations.assertNoFieldsMissing(document, this.projectConfiguration);
        Validations.assertCorrectnessOfNumericalValues(document, this.projectConfiguration);

        const errWithParams = Validations.validateStructureOfGeometries(document.resource.geometry as any);
        if (errWithParams) throw errWithParams;
    }


    public async isRecordedInTargetAllowedRelationDomainType(document: NewDocument, mainTypeDocumentId: string) {

        const mainTypeDocument = await this.datastore.get(mainTypeDocumentId);
        if (!this.projectConfiguration.isAllowedRelationDomainType(document.resource.type,
            mainTypeDocument.resource.type, 'isRecordedIn')) {

            throw [ImportErrors.INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                mainTypeDocument.resource.type];
        }
    }
}