import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2';
import {M} from '../../m';
import {Validations} from './validations';
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';
import {TypeUtility} from './type-utility';


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
     * @param document
     * @param suppressFieldsAndRelationsCheck
     * @param suppressIdentifierCheck
     * @param suppressIsRecordedInCheck
     * @returns resolves with () if validation passed
     * @throws [INVALID_TYPE] if type is not configured in projectConfiguration
     * @throws [NO_ISRECORDEDIN] if type should have a isRecordedIn but doesn't have one
     * @throws [NO_ISRECORDEDIN_TARGET]
     * @throws [IDENTIFIER_EXISTS]
     * @throws [MISSING_PROPERTY]
     * @throws [MISSING_GEOMETRYTYPE]
     * @throws [MISSING_COORDINATES]
     * @throws [INVALID_COORDINATES]
     * @throws [UNSUPPORTED_GEOMETRY_TYPE]
     * @throws [INVALID_RELATIONS]
     * @throws [INVALID_FIELDS]
     * @throws [INVALID_NUMERICAL_VALUE]
     */
    public async validate(
        document: Document|NewDocument,
        suppressFieldsAndRelationsCheck = false,
        suppressIdentifierCheck = false,
        suppressIsRecordedInCheck = false,
    ): Promise<void> {

        if (!Validations.validateType(document.resource, this.projectConfiguration)) {
            throw [M.VALIDATION_ERROR_INVALIDTYPE, document.resource.type];
        }

        if (!suppressIsRecordedInCheck && this.isIsRecordedInRelationMissing(document as Document)) {
            throw [M.VALIDATION_ERROR_NORECORDEDIN]; // TODO test in validator
        }

        const missingProperties = Validations.getMissingProperties(document.resource, this.projectConfiguration);
        if (missingProperties.length > 0) {
            throw [M.VALIDATION_ERROR_MISSINGPROPERTY, document.resource.type]
                .concat(missingProperties.join((', ')));
        }

        if (!suppressFieldsAndRelationsCheck) Validator.validateFieldsAndRelations(document as Document, this.projectConfiguration);
        Validator.validateNumericalValues(document as Document, this.projectConfiguration);

        const msgWithParams = Validator.validateGeometry(document.resource.geometry as any);
        if (msgWithParams) throw msgWithParams;


        if (document.resource.relations['isRecordedIn'] && document.resource.relations['isRecordedIn'].length > 0) {
            const invalidRelationTarget = await this.validateRelationTargets(document as Document, 'isRecordedIn');
            if (invalidRelationTarget) throw [M.VALIDATION_ERROR_NORECORDEDINTARGET, invalidRelationTarget.join(', ')];
        }

        if (!suppressIdentifierCheck) await this.validateIdentifier(document as any);
    }


    private isIsRecordedInRelationMissing(document: Document): boolean {

        return this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document, 'isRecordedIn');
    }


    private isExpectedToHaveIsRecordedInRelation(document: Document): boolean {

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

        return (await this.datastore.find({constraints: {'id:match': targetId}})).documents.length === 1;
    }


    private async validateIdentifier(doc: IdaiFieldDocument): Promise<any> {

        let result;

        try {
            result = await this.datastore.find({
                constraints: {
                    'identifier:match': doc.resource.identifier
                }
            });
        } catch (e) {
            throw ([M.ALL_FIND_ERROR]);
        }

        if (result.totalCount > 0 && Validator.isDuplicate(result.documents[0], doc)) {
            return Promise.reject([M.MODEL_VALIDATION_ERROR_IDEXISTS, doc.resource.identifier]);
        }
    }


    private static validateGeometry(geometry: IdaiFieldGeometry): Array<string>|null {

        if (!geometry) return null;

        if (!geometry.type) return [ M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE ];
        if (!geometry.coordinates) return [ M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES ];

        switch(geometry.type) {
            case 'Point':
                if (!Validations.validatePointCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'Point' ];
                }
                break;
            case 'LineString':
                if (!Validations.validatePolylineCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'LineString' ];
                }
                break;
            case 'MultiLineString':
                if (!Validations.validateMultiPolylineCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'MultiLineString' ];
                }
                break;
            case 'Polygon':
                if (!Validations.validatePolygonCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'Polygon' ];
                }
                break;
            case 'MultiPolygon':
                if (!Validations.validateMultiPolygonCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'MultiPolygon' ];
                }
                break;
            default:
                return [ M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE, geometry.type ];
        }

        return null;
    }


    private static validateFieldsAndRelations(document: Document, projectConfiguration: ProjectConfiguration) {

        const invalidFields = Validations.validateFields(document.resource, projectConfiguration);
        if (invalidFields.length > 0) {
            throw [invalidFields.length === 1 ?
                M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS]
                .concat([document.resource.type])
                .concat(invalidFields.join(', '));
        }

        const invalidRelationFields = Validations.validateRelations(document.resource, projectConfiguration);
        if (invalidRelationFields.length > 0) {
            throw [invalidRelationFields.length === 1 ?
                M.VALIDATION_ERROR_INVALIDRELATIONFIELD :
                M.VALIDATION_ERROR_INVALIDRELATIONFIELDS]
                .concat([document.resource.type])
                .concat([invalidRelationFields.join(', ')]);
        }
    }


    private static validateNumericalValues(document: Document, projectConfiguration: ProjectConfiguration) {

        const invalidNumericValues = Validations.validateNumericValues(document.resource, projectConfiguration);
        if (invalidNumericValues ) {
            throw [invalidNumericValues.length === 1 ?
                M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE :
                M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES]
                .concat([document.resource.type])
                .concat([invalidNumericValues.join(', ')]);
        }
    }


    private static isDuplicate(result: any, doc: any) {

        return result.resource.id !== doc.resource.id;
    }
}