import {ConfigLoader} from 'idai-components-2/configuration'
import {ReadDatastore} from 'idai-components-2/datastore'
import {Validator} from 'idai-components-2/persist';
import {IdaiFieldDocument} from './idai-field-document';
import {Datastore, Query, FilterSet, Filter} from "idai-components-2/datastore";
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

            let q : Query = {q:doc.resource['identifier'],filterSets:[]};

            this.datastore.find(q,'identifier').then(results => {

                let other = 0;
                for (let result of results) {
                  if (result.resource['identifier'] == doc.resource['identifier']) { // necessary because at the moment find 'o2' will also find 'o22'
                      if (result.resource['id'] != doc.resource['id']) other++;
                  }
                }
                if (other > 0) return reject([M.DATASTORE_IDEXISTS]);

                resolve();
            });
        });
    }
}