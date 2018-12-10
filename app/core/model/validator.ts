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

    /**
     * @param suppressRecordedInTargetCheck
     * // @throws [PREVALIDATION_INVALID_TYPE] if type is not configured in projectConfiguration
     *
     * @throws [NO_ISRECORDEDIN_TARGET]
     * @throws [MISSING_GEOMETRYTYPE]
     * @throws [MISSING_COORDINATES]
     * @throws [INVALID_COORDINATES]
     * @throws [UNSUPPORTED_GEOMETRY_TYPE]
     * @throws [INVALID_NUMERICAL_VALUE]
     */
    public async validate(document: Document|NewDocument, suppressRecordedInTargetCheck): Promise<void> {

        Validator.validateNumericalValues(document as Document, this.projectConfiguration);

        if (!suppressRecordedInTargetCheck && document.resource.relations['isRecordedIn'] && document.resource.relations['isRecordedIn'].length > 0) {
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
     * @throws [IDENTIFIER_EXISTS]
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
            throw[ValidationErrors.IDENTIFIER_EXISTS, document.resource.identifier];
        }
    }



    /**
     * Asserts
     *   * that the type is known and
     *   * the fields and relations defined in a given document are actually configured
     *     fields and relations for the type of resource defined.
     *   * that the geometry is structurally valid
     *   * that it has the isRecordedIn if the type requires it
     *   * there are no mandatory fields missing
     *
     * Does not assert validity of any of the fields or relations contents.
     *
     * @throws [INVALID_TYPE]
     * @throws [INVALID_RELATIONS]
     * @throws [INVALID_FIELDS]
     * @throws [NO_ISRECORDEDIN]
     * @throws [MISSING_PROPERTY]
     */
    public assertIsWellformed(document: Document|NewDocument): void { // TODO do missing property check

        if (!Validations.validateType(document.resource, this.projectConfiguration)) {
            throw [ValidationErrors.INVALID_TYPE, document.resource.type];
        }

        const invalidFields = Validations.assertDefinedFieldsAreAllowed(document.resource, this.projectConfiguration);
        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_FIELDS,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }

        const invalidRelationFields = Validations.assertDefinedRelationsAreAllowed(document.resource, this.projectConfiguration);
        if (invalidRelationFields.length > 0) {
            throw [
                ValidationErrors.INVALID_RELATIONS,
                document.resource.type,
                invalidRelationFields.join(', ')
            ];
        }

        this.assertNoFieldsMissing(document);

        const msgWithParams = Validator.validateGeometry(document.resource.geometry as any);
        if (msgWithParams) throw msgWithParams;

        this.assertHasIsRecordedIn(document);
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


    private static validateGeometry(geometry: IdaiFieldGeometry): Array<string>|null {

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


    private static validateNumericalValues(document: Document, projectConfiguration: ProjectConfiguration) {

        const invalidNumericValues = Validations.validateNumericValues(document.resource, projectConfiguration);
        if (invalidNumericValues ) {
            throw [
                ValidationErrors.INVALID_NUMERICAL_VALUES,
                document.resource.type,
                invalidNumericValues.join(', ')
            ];
        }
    }


    private static isNotSameDocument(result: any, doc: any) {

        return result.resource.id !== doc.resource.id;
    }
}