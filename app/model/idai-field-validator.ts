import {ConfigLoader} from 'idai-components-2/configuration'
import {Validator} from 'idai-components-2/persist';
import {IdaiFieldDocument} from './idai-field-document';
import {IdaiFieldGeometry} from './idai-field-geometry';
import {M} from "../m";
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdaiFieldValidator extends Validator {

    constructor(configLoader: ConfigLoader, private datastore: IdaiFieldDatastore) {
        super(configLoader);
    }

    /**
     * @param doc
     * @returns {Promise<void>}
     * @returns {Promise<void>} resolves with () or rejects with msgsWithParams in case of validation error
     */
    protected validateCustom(doc: IdaiFieldDocument): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.validateIdentifier(doc).then(
                () => {
                    let msgWithParams = IdaiFieldValidator.validateGeometry(doc.resource.geometry);
                    if (!msgWithParams) {
                        resolve();
                    } else {
                        reject(msgWithParams);
                    }
                },
                err => reject(err)
            );
        });
    }

    private validateIdentifier(doc: IdaiFieldDocument): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.datastore.findByIdentifier(doc.resource.identifier).then(result => {

                if (result && IdaiFieldValidator.isDuplicate(result, doc))
                    return reject([M.MODEL_VALIDATION_ERROR_IDEXISTS, doc.resource.identifier]);
                resolve();
            }, () => {
                resolve();
            });
        });
    }

    private static validateGeometry(geometry: IdaiFieldGeometry): Array<string> {

        if (!geometry) return null;

        if (!geometry.type) return [ M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE ];
        if (!geometry.coordinates) return [ M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES ];

        switch(geometry.type) {
            case 'Point':
                if (!IdaiFieldValidator.validatePointCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'Point' ];
                }
                break;
            case 'Polygon':
                if (!IdaiFieldValidator.validatePolygonCoordinates(geometry.coordinates)) {
                    return [ M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES, 'Polygon' ];
                }
                break;
            default:
                return [ M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE, geometry.type ];
        }

        return null;
    }

    private static validatePointCoordinates(coordinates: number[]): boolean {

        if (coordinates.length != 2) return false;
        if (isNaN(coordinates[0])) return false;
        if (isNaN(coordinates[1])) return false;

        return true;
    }

    private static validatePolygonCoordinates(coordinates: number[][][]): boolean {

        if (coordinates.length == 0) return false;

        for (let i in coordinates) {
            if (coordinates[i].length < 3) return false;

            for (let j in coordinates[i]) {
                if (!IdaiFieldValidator.validatePointCoordinates(coordinates[i][j])) return false;
            }
        }

        return true;
    }

    private static isDuplicate(result, doc) {
        return result.resource.id != doc.resource.id;
    }
}