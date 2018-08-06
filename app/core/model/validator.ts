import {Injectable} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {Document, NewDocument} from 'idai-components-2/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/field';
import {M} from '../../m';
import {Validations} from './validations';
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: IdaiFieldDocumentDatastore) {}

    /**
     * @param doc
     * @returns resolves with () or rejects with msgsWithParams
     */
    public async validate(doc: Document|NewDocument): Promise<void> {

        let resource = doc.resource;

        if (!Validations.validateType(resource, this.projectConfiguration)) {
            throw [M.VALIDATION_ERROR_INVALIDTYPE, resource.type];
        }

        let missingProperties = Validations.getMissingProperties(resource, this.projectConfiguration);
        if (missingProperties.length > 0) {
            throw [M.VALIDATION_ERROR_MISSINGPROPERTY, resource.type]
                .concat(missingProperties.join((', ')));
        }

        const invalidFields = Validations.validateFields(resource, this.projectConfiguration);
        if (invalidFields.length > 0) {
            const err = [invalidFields.length == 1 ?
                M.VALIDATION_ERROR_INVALIDFIELD : M.VALIDATION_ERROR_INVALIDFIELDS];
            err.push(resource.type);
            err.push(invalidFields.join(', '));
            throw err;
        }

        const invalidRelationFields = Validations.validateRelations(resource, this.projectConfiguration);
        if (invalidRelationFields.length > 0) {
            const err = [invalidRelationFields.length == 1 ?
                M.VALIDATION_ERROR_INVALIDRELATIONFIELD :
                M.VALIDATION_ERROR_INVALIDRELATIONFIELDS];
            err.push(resource.type);
            err.push(invalidRelationFields.join(', '));
            throw err;
        }

        let invalidNumericValues;
        if (invalidNumericValues = Validations.validateNumericValues(resource, this.projectConfiguration)) {
            let err = [invalidNumericValues.length == 1 ?
                M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE :
                M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES];
            err.push(resource.type);
            err.push(invalidNumericValues.join(', '));
            throw err;
        }


        let msgWithParams = Validator.validateGeometry(doc.resource.geometry as any);
        if (msgWithParams) return Promise.reject(msgWithParams);


        return this.datastore ? this.validateIdentifier(doc as any) : Promise.resolve();
    }


    public async validateRelationTargets(document: IdaiFieldDocument,
                                         relationName: string): Promise<string[]> {

        if (!Document.hasRelations(document, relationName)) return [];

        const invalidRelationTargetIds: string[] = [];

        for (let targetId of document.resource.relations[relationName]) {
            if (!(await this.isExistingRelationTarget(targetId))) invalidRelationTargetIds.push(targetId);
        }

        return invalidRelationTargetIds;
    }


    private async isExistingRelationTarget(targetId: string): Promise<boolean> {

        const {documents} = await this.datastore.find({
            constraints: {
                'id:match': targetId
            }
        });

        return documents.length === 1;
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


    // TODO use comparator from tsfun
    private static isDuplicate(result: any, doc: any) {

        return result.resource.id !== doc.resource.id;
    }
}