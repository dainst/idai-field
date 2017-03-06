import {Injectable} from "@angular/core";
import {Document} from "idai-components-2/core";
import {ImportStrategy} from "./import-strategy";
import {Validator} from "idai-components-2/persist";
import {Datastore} from "idai-components-2/datastore";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class DefaultImportStrategy implements ImportStrategy {

    constructor(private validator: Validator, private datastore: Datastore) { }

    go(doc: Document): Promise<any> {
        return this.validator.validate(doc)
            .then(() => {
                return this.datastore.create(doc).catch(keyOfM=>Promise.reject([keyOfM]));
            })
    }
}