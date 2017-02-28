import {ConfigLoader} from 'idai-components-2/configuration'
import {Validator} from 'idai-components-2/persist';
import {IdaiFieldDocument} from './idai-field-document';
import {M} from "../m";
import {PouchdbDatastore} from '../datastore/pouchdb-datastore';



/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldValidator extends Validator {

    constructor(configLoader:ConfigLoader, private datastore:PouchdbDatastore) {
        super(configLoader);
    }

    /**
     * @param doc
     * @returns {Promise<void>}
     * @returns {Promise<void>} resolves with () or rejects with msgsWithParams in case of validation error
     */
    protected validateCustom(doc:IdaiFieldDocument): Promise<any> {
        return new Promise<any>((resolve,reject) => {

            this.datastore.findByIdentifier(doc.resource.identifier).then(result => {

                if (IdaiFieldValidator.isDuplicate(result,doc)) return reject([M.VALIDATION_ERROR_IDEXISTS,doc.resource.identifier]);
                resolve();
            });
        });
    }

    private static isDuplicate(results,doc) {
        let other = 0;
        for (let result of results) {
            if (result.resource.identifier == doc.resource.identifier) { // necessary because at the moment find 'o2' will also find 'o22'
                if (result.resource.id != doc.resource.id) other++;
            }
        }
        return (other > 0);
    }
}