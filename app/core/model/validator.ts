import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2';
import {M} from '../../m';
import {Validations} from './validations';
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';
import {to} from 'tsfun';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: IdaiFieldDocumentDatastore) {}

    /**
     * @param document
     * @param suppressFieldsAndRelationsCheck
     * @param suppressIdentifierCheck
     * @returns resolves with () or rejects with msgsWithParams
     */
    public async validate(
        document: Document|NewDocument,
        suppressFieldsAndRelationsCheck = false,
        suppressIdentifierCheck = false
    ): Promise<void> {

        if (!Validations.validateType(document.resource, this.projectConfiguration)) {
            throw [M.VALIDATION_ERROR_INVALIDTYPE, document.resource.type];
        }

        const missingProperties = Validations.getMissingProperties(document.resource, this.projectConfiguration);
        if (missingProperties.length > 0) {
            throw [M.VALIDATION_ERROR_MISSINGPROPERTY, document.resource.type]
                .concat(missingProperties.join((', ')));
        }

        if (!suppressFieldsAndRelationsCheck) this.validateFieldsAndRelations(document as Document);

        const invalidNumericValues = Validations.validateNumericValues(document.resource, this.projectConfiguration);
        if (invalidNumericValues ) {
            throw [invalidNumericValues.length === 1 ?
                    M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE :
                    M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES]
                .concat([document.resource.type])
                .concat([invalidNumericValues.join(', ')]);
        }


        const msgWithParams = Validator.validateGeometry(document.resource.geometry as any);
        if (msgWithParams) throw msgWithParams;


        if (document.resource.relations['isRecordedIn'] && document.resource.relations['isRecordedIn'].length > 0) {
            const invalidRelationTarget = await this.validateRelationTargets(document as Document, 'isRecordedIn');
            if (invalidRelationTarget) throw [M.VALIDATION_ERROR_NORECORDEDINTARGET, invalidRelationTarget.join(',')];
        }

        if (this.datastore && !suppressIdentifierCheck) this.validateIdentifier(document as any);
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


    private validateFieldsAndRelations(document: Document) {

        const invalidFields = Validations.validateFields(document.resource, this.projectConfiguration);
        if (invalidFields.length > 0) {
            throw [invalidFields.length === 1 ?
                M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS]
                .concat([document.resource.type])
                .concat(invalidFields.join(', '));
        }

        const invalidRelationFields = Validations.validateRelations(document.resource, this.projectConfiguration);
        if (invalidRelationFields.length > 0) {
            throw [invalidRelationFields.length === 1 ?
                M.VALIDATION_ERROR_INVALIDRELATIONFIELD :
                M.VALIDATION_ERROR_INVALIDRELATIONFIELDS]
                .concat([document.resource.type])
                .concat([invalidRelationFields.join(', ')]);
        }
    }


    private validateIdentifier(doc: IdaiFieldDocument): Promise<any> {

        return this.datastore.find({
            constraints: {
                'identifier:match': doc.resource.identifier
            }
        }).then(result => {
            if (result.totalCount > 0 && Validator.isDuplicate(result.documents[0], doc)) {
                return Promise.reject([M.MODEL_VALIDATION_ERROR_IDEXISTS, doc.resource.identifier]);
            }
            return Promise.resolve();
        }, () => {
            return Promise.reject([M.ALL_FIND_ERROR]);
        });
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


    private static isDuplicate(result: any, doc: any) {

        return result.resource.id !== doc.resource.id;
    }
}