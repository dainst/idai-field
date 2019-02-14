import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration, Query} from 'idai-components-2';
import {TypeUtility} from '../../model/type-utility';
import {Validator} from '../../model/validator';
import {Validations} from '../../model/validations';
import {ImportErrors} from './import-errors';
import {ValidationErrors} from '../../model/validation-errors';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {isnt} from 'tsfun';


@Injectable()
/**
 * Validates against data model of ProjectConfiguration and TypeUtility and contents of Database
 *
 * Errors thrown are of type
 *   ImportError.* if specified in ImportValidator itself and of type
 *   ValidationError.* if coming from the Validator
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImportValidator extends Validator {

    constructor(projectConfiguration: ProjectConfiguration,
                private datastore: DocumentDatastore,
                typeUtility: TypeUtility) {

        super(projectConfiguration, (q: Query) => datastore.find(q), typeUtility);
    }


    /**
     * @throws [INVALID_TYPE]
     */
    public assertIsKnownType(document: Document|NewDocument) {

        if (!Validations.validateType(document.resource, this.projectConfiguration)) {
            throw [ImportErrors.INVALID_TYPE, document.resource.type];
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


    public async assertIsNotOverviewType(document: Document|NewDocument) {

        if (this.typeUtility.getOverviewTypeNames().includes(document.resource.type)) {

            throw [ImportErrors.OPERATIONS_NOT_ALLOWED];
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
     * @throws [ImportErrors.INVALID_RELATIONS]
     * @throws [ImportErrors.INVALID_FIELDS]
     * @throws [ValidationErrors.MISSING_PROPERTY]
     * @throws [ValidationErrors.MISSING_GEOMETRYTYPE]
     * @throws [ValidationErrors.MISSING_COORDINATES]
     * @throws [ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE]
     * @throws [ValidationErrors.INVALID_COORDINATES]
     * @throws [ValidationErrors.INVALID_NUMERICAL_VALUE]
     */
    public assertIsWellformed(document: Document|NewDocument): void {

        const invalidFields = Validations.validateDefinedFields(document.resource, this.projectConfiguration);
        if (invalidFields.length > 0) {
            throw [
                ImportErrors.INVALID_FIELDS,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }

        const invalidRelationFields = Validations
            .validateDefinedRelations(document.resource, this.projectConfiguration)
            // operations have empty isRecordedIn which however is not defined. image types must not be imported. regular types all have isRecordedIn
            .filter(isnt('isRecordedIn'));

        if (invalidRelationFields.length > 0) {
            throw [
                ImportErrors.INVALID_RELATIONS,
                document.resource.type,
                invalidRelationFields.join(', ')
            ];
        }

        Validations.assertNoFieldsMissing(document, this.projectConfiguration);
        Validations.assertCorrectnessOfNumericalValues(document, this.projectConfiguration, false);

        const errWithParams = Validations.validateStructureOfGeometries(document.resource.geometry as any);
        if (errWithParams) throw errWithParams;
    }


    public assertHasLiesWithin(document: Document|NewDocument) {

        if (this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document as Document, 'liesWithin')) { // isRecordedIn gets constructed from liesWithin

            throw [ImportErrors.NO_PARENT_ASSIGNED];
        }
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