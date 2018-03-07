import {ConfigLoader} from 'idai-components-2/configuration'
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {M} from '../../m';
import {IdaiFieldDocumentDatastore} from '../datastore/idai-field-document-datastore';
import {Validator} from './validator';
import {ModelUtil} from './model-util';
import {Validations} from './validations';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdaiFieldValidator extends Validator {

    constructor(configLoader: ConfigLoader,
                private datastore: IdaiFieldDocumentDatastore) {
        super(configLoader);
    }


    public async validateRelationTargets(document: IdaiFieldDocument,
                                         relationName: string): Promise<string[]> {

        if (!ModelUtil.hasRelations(document, relationName)) return [];

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

        return Promise.resolve(documents.length == 1);
    }

    
    /**
     * @param doc
     * @returns {Promise<void>}
     * @returns {Promise<void>} resolves with () or rejects with msgsWithParams in case of validation error
     */
    protected async validateCustom(doc: IdaiFieldDocument): Promise<any> {

        try {
            await this.validateIdentifier(doc);

            let msgWithParams = await IdaiFieldValidator.validateGeometry(doc.resource.geometry as any);
            if (!msgWithParams) {
                return Promise.resolve();
            } else {
                return Promise.reject(msgWithParams);
            }
        } catch(msgWithParams) {
            return Promise.reject(msgWithParams);
        }
    }
    

    private validateIdentifier(doc: IdaiFieldDocument): Promise<any> {

        return this.datastore.find({
                constraints: {
                    'identifier:match': doc.resource.identifier
                }
            }).then(result => {
                if (result.totalCount > 0 && IdaiFieldValidator.isDuplicate(result.documents[0], doc)) {
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

        return result.resource.id != doc.resource.id;
    }
}