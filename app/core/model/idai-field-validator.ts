import {ProjectConfiguration, Document} from 'idai-components-2/core'
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/field';
import {M} from '../../m';
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';
import {Validator} from './validator';
import {Validations} from './validations';
import {sameOn} from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdaiFieldValidator extends Validator {

    constructor(projectConfiguration: ProjectConfiguration,
                private datastore: IdaiFieldDocumentDatastore) {
        super(projectConfiguration);
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

    
    /**
     * @param doc
     * @returns {Promise<void>}
     * @returns {Promise<void>} resolves with () or rejects with msgsWithParams in case of validation error
     */
    protected async validateCustom(doc: IdaiFieldDocument): Promise<void> {

        await this.validateIdentifier(doc);

        const msgWithParams = await IdaiFieldValidator.validateGeometry(doc.resource.geometry as any);
        if (msgWithParams) throw msgWithParams;
    }
    

    private validateIdentifier(doc: IdaiFieldDocument): Promise<any> {

        return this.datastore.find({
                constraints: {
                    'identifier:match': doc.resource.identifier
                }
            }).then(result => {
                if (result.totalCount > 0 && sameOn('resource.id', result.documents[0], doc)) {
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
}