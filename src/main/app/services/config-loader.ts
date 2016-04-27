import {Injectable} from "angular2/core";
import {DataModelConfiguration} from "./data-model-configuration";
import {Messages} from "./messages";
import {Http} from "angular2/http";


/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class ConfigLoader {
    
    constructor(
        private http: Http,
        private messages: Messages){
    }

    public getDataModelConfiguration() : Promise<DataModelConfiguration> {
        return DataModelConfiguration.createInstance(this.http,this.messages);
    }
    
}