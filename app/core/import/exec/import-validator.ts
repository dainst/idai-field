import {Injectable} from '@angular/core';
import {Document, NewDocument, NewResource, Query, Resource} from 'idai-components-2';
import {TypeUtility} from '../../model/type-utility';
import {Validator} from '../../model/validator';
import {Validations} from '../../model/validations';
import {ImportErrors as E} from './import-errors';
import {ValidationErrors} from '../../model/validation-errors';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {includedIn, is, isNot, isnt, on} from 'tsfun';
import {INPUT_TYPES} from '../../../c';
import {HIERARCHICAL_RELATIONS} from '../../model/relation-constants';
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import {ProjectConfiguration} from '../../configuration/project-configuration';


type ResourceId = string;


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


    public assertIsAllowedRelationDomainType(domainTypeName: string,
                                             rangeTypeName: string,
                                             relationName: string,
                                             identifier: string) {

        if (!this.projectConfiguration.isAllowedRelationDomainType(domainTypeName, rangeTypeName, relationName)) {

            throw [E.TARGET_TYPE_RANGE_MISMATCH, identifier, relationName, rangeTypeName];
        }
    }


    public async assertLiesWithinCorrectness(resources: Array<Resource>) {

        for (let resource of resources) {

            const type = this.projectConfiguration.getTypesList().find(on('name', is(resource.type)));
            if (!type) {
                console.error("resource type not found", resource.type);
                continue;
            }
            if (!type.mustLieWithin) continue;

            const recordedIn = resource.relations[RECORDED_IN];
            const liesWithin = resource.relations[LIES_WITHIN];

            if (recordedIn && recordedIn.length > 0 && (!liesWithin || liesWithin.length === 0)) {

                throw [E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE, resource.type, resource.identifier];
            }
        }
    }


    /**
     * @throws [INVALID_TYPE]
     */
    public assertIsKnownType(document: Document|NewDocument) {

        if (!Validations.validateType(document.resource, this.projectConfiguration)) {
            throw [E.INVALID_TYPE, document.resource.type];
        }
    }


    public assertIsAllowedType(document: Document|NewDocument, mergeMode: boolean) {

        if (document.resource.type === 'Operation'
            || document.resource.type === 'Project') {

            throw [E.TYPE_NOT_ALLOWED, document.resource.type];
        }

        if (!mergeMode && (document.resource.type === 'Image'
            || this.typeUtility.isSubtype(document.resource.type, 'Image'))) {

            throw [E.TYPE_ONLY_ALLOWED_ON_UPDATE, document.resource.type];
        }
    }


    public async assertIsNotOverviewType(document: Document|NewDocument) {

        if (this.typeUtility.getOverviewTypeNames().includes(document.resource.type)) {

            throw [E.OPERATIONS_NOT_ALLOWED];
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
     * @throws [E.INVALID_RELATIONS]
     * @throws [E.INVALID_FIELDS]
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
                E.INVALID_FIELDS,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }

        const invalidRelationFields = Validations
            .validateDefinedRelations(document.resource, this.projectConfiguration)
            // operations have empty RECORDED_IN which however is not defined. image types must not be imported. regular types all have RECORDED_IN
            .filter(isnt(RECORDED_IN));

        if (invalidRelationFields.length > 0) {
            throw [
                E.INVALID_RELATIONS,
                document.resource.type,
                invalidRelationFields.join(', ')
            ];
        }

        Validations.assertNoFieldsMissing(document, this.projectConfiguration);
        Validations.assertCorrectnessOfNumericalValues(document, this.projectConfiguration, false);
        Validations.assertCorrectnessOfDatingValues(document, this.projectConfiguration);
        Validations.assertCorrectnessOfDimensionValues(document, this.projectConfiguration);

        const errWithParams = Validations.validateStructureOfGeometries(document.resource.geometry as any);
        if (errWithParams) throw errWithParams;
    }


    public assertHasLiesWithin(document: Document|NewDocument) {

        if (this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document as Document, LIES_WITHIN)) { // isRecordedIn gets constructed from liesWithin

            throw [E.NO_PARENT_ASSIGNED];
        }
    }


    public async isRecordedInTargetAllowedRelationDomainType(document: NewDocument, mainTypeDocumentId: ResourceId) {

        const mainTypeDocument = await this.datastore.get(mainTypeDocumentId);
        if (!this.projectConfiguration.isAllowedRelationDomainType(document.resource.type,
            mainTypeDocument.resource.type, RECORDED_IN)) {

            throw [E.INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                mainTypeDocument.resource.type];
        }
    }


    /**
     * @throws [E.INVALID_DROPDOWN_RANGE_VALUES, fieldName]
     */
    public assertDropdownRangeComplete(resource: NewResource): void {

        const fieldDefinitions = this.projectConfiguration.getFieldDefinitions(resource.type);

        for (let fieldName of Object.keys(resource).filter(isNot(includedIn(['relations', 'geometry'])))) {

            let fieldDefinition = fieldDefinitions.find(on('name', is(fieldName)));
            const dropdownRangeFieldName = fieldName.replace('End', '');

            if (!fieldDefinition) {
                if (fieldName.endsWith('End')) {
                    fieldDefinition = fieldDefinitions.find(on('name', is(dropdownRangeFieldName)))
                }
                if (!fieldDefinition) continue;
            }
            if (fieldDefinition.inputType !== INPUT_TYPES.DROPDOWN_RANGE) continue;

            if (resource[dropdownRangeFieldName + 'End'] && !(resource[dropdownRangeFieldName])) {
                throw [E.INVALID_DROPDOWN_RANGE_VALUES, dropdownRangeFieldName];
            }
        }
    }
}