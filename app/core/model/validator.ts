import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration, IdaiFieldGeometry} from 'idai-components-2';
import {Validations} from './validations';
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';
import {TypeUtility} from './type-utility';
import {ValidationErrors} from './validation-errors';
import {M} from '../../components/m';


@Injectable()
/**
 * Validates against data model of ProjectConfiguration and TypeUtility and contents of Database
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: IdaiFieldDocumentDatastore,
                private typeUtility: TypeUtility) {}

    // TODO what about this leftover? @throws [PREVALIDATION_INVALID_TYPE] if type is not configured in projectConfiguration


    /** TODO make use of it in default import strat
     * @throws [NO_ISRECORDEDIN_TARGET]
     */
    public async assertIsRecordedInTargetsExists(document: Document|NewDocument): Promise<void> {

        if (document.resource.relations['isRecordedIn'] && document.resource.relations['isRecordedIn'].length > 0) {
            const invalidRelationTargets = await this.validateRelationTargets(document as Document, 'isRecordedIn');
            if (invalidRelationTargets) {
                throw [
                    ValidationErrors.NO_ISRECORDEDIN_TARGET,
                    invalidRelationTargets.join(', ')
                ];
            }
        }
    }


    /**
     * @throws [IDENTIFIER_ALREADY_EXISTS]
     */
    public async assertIdentifierIsUnique(document: Document|NewDocument): Promise<void> {

        let result;

        try {
            result = await this.datastore.find({
                constraints: { 'identifier:match': document.resource.identifier }
            });
        } catch (e) {
            throw ([M.ALL_ERROR_FIND]); // TODO make generic or unknown error or something
        }

        if (result.totalCount > 0 && Validator.isNotSameDocument(result.documents[0], document)) {
            throw[ValidationErrors.IDENTIFIER_ALREADY_EXISTS, document.resource.identifier];
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

        const invalidRelationFields = Validations.validateDefinedRelations(document.resource, this.projectConfiguration);
        if (invalidRelationFields.length > 0) {
            throw [
                ValidationErrors.INVALID_RELATIONS,
                document.resource.type,
                invalidRelationFields.join(', ')
            ];
        }

        this.assertNoFieldsMissing(document);
        this.assertCorrectnessOfNumericalValues(document);

        const errWithParams = Validator.validateStructureOfGeometries(document.resource.geometry as any);
        if (errWithParams) throw errWithParams;
    }


    /**
     * @throws [INVALID_TYPE]
     */
    public assertIsKnownType(document: Document|NewDocument) {

        if (!Validations.validateType(document.resource, this.projectConfiguration)) {
            throw [ValidationErrors.INVALID_TYPE, document.resource.type];
        }
    }


    /**
     * @throws [INVALID_NUMERICAL_VALUE]
     */
    public assertCorrectnessOfNumericalValues(document: Document|NewDocument) {

        const invalidNumericValues = Validations.validateNumericValues(document.resource, this.projectConfiguration);
        if (invalidNumericValues ) {
            throw [
                ValidationErrors.INVALID_NUMERICAL_VALUES,
                document.resource.type,
                invalidNumericValues.join(', ')
            ];
        }
    }


    /**
     * @throws [MISSING_PROPERTY]
     */
    public assertNoFieldsMissing(document: Document|NewDocument): void {

        const missingProperties = Validations.getMissingProperties(document.resource, this.projectConfiguration);
        if (missingProperties.length > 0) {
            throw [
                ValidationErrors.MISSING_PROPERTY,
                document.resource.type,
                missingProperties.join(', ')
            ];
        }
    }


    /**
     * @throws [NO_ISRECORDEDIN]
     */
    public assertHasIsRecordedIn(document: Document|NewDocument): void {

        if (this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document as Document, 'isRecordedIn')) {

            throw [ValidationErrors.NO_ISRECORDEDIN];
        }
    }


    private isExpectedToHaveIsRecordedInRelation(document: Document|NewDocument): boolean {

        return !this.typeUtility
            ? false
            : this.typeUtility
                .getRegularTypeNames()
                .includes(document.resource.type);
    }


    private async validateRelationTargets(document: Document,
                                          relationName: string): Promise<string[]|undefined> {

        if (!Document.hasRelations(document, relationName)) return [];

        const invalidRelationTargetIds: string[] = [];

        for (let targetId of document.resource.relations[relationName]) {
            if (!(await this.isExistingRelationTarget(targetId))) invalidRelationTargetIds.push(targetId);
        }

        return invalidRelationTargetIds.length > 0 ? invalidRelationTargetIds : undefined;
    }


    private async isExistingRelationTarget(targetId: string): Promise<boolean> {

        return (await this.datastore.find({ constraints: { 'id:match': targetId } })).documents.length === 1;
    }


    private static validateStructureOfGeometries(geometry: IdaiFieldGeometry): Array<string>|null {

        if (!geometry) return null;

        if (!geometry.type) return [ValidationErrors.MISSING_GEOMETRY_TYPE];
        if (!geometry.coordinates) return [ValidationErrors.MISSING_COORDINATES];

        switch(geometry.type) {
            case 'Point':
                if (!Validations.validatePointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'Point'];
                }
                break;
            case 'MultiPoint':
                if (!Validations.validatePolylineOrMultiPointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiPoint'];
                }
                break;
            case 'LineString':
                if (!Validations.validatePolylineOrMultiPointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'LineString'];
                }
                break;
            case 'MultiLineString':
                if (!Validations.validateMultiPolylineCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiLineString'];
                }
                break;
            case 'Polygon':
                if (!Validations.validatePolygonCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'Polygon'];
                }
                break;
            case 'MultiPolygon':
                if (!Validations.validateMultiPolygonCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiPolygon'];
                }
                break;
            default:
                return [ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE, geometry.type];
        }

        return null;
    }


    private static isNotSameDocument(result: any, doc: any) {

        return result.resource.id !== doc.resource.id;
    }
}