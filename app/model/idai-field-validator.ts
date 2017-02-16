import {ConfigLoader} from 'idai-components-2/configuration'
import {ReadDatastore} from 'idai-components-2/datastore'
import {Validator} from 'idai-components-2/persist';
import {IdaiFieldDocument} from './idai-field-document';
import {M} from "../m";

/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldValidator extends Validator {

    constructor(configLoader:ConfigLoader,private datastore:ReadDatastore) {
        super(configLoader)
    }

    /**
     * @param doc
     * @returns {Promise<void>}
     * @returns {Promise<void>} resolves with () or rejects with msgsWithParams in case of validation error
     */
    protected validateCustom(doc:IdaiFieldDocument): Promise<any> {
        return new Promise<any>((resolve,reject) => {
            resolve();
        });
    }
}