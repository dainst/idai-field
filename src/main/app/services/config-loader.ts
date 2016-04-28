import {Injectable} from "angular2/core";
import {DataModelConfiguration} from "./data-model-configuration";
import {Messages} from "./messages";
import {Http} from "angular2/http";
import {MessagesDictionary} from "./messages-dictionary";


/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class ConfigLoader {

    private static DATA_MODEL_CONFIGURATION_PATH='config/Configuration.json';
    
    constructor(
        private http: Http,
        private messages: Messages){
    }

    public getDataModelConfiguration() : Promise<DataModelConfiguration> {

        return new Promise<DataModelConfiguration>((resolve,reject) => {
            this.http.get(ConfigLoader.DATA_MODEL_CONFIGURATION_PATH).
            subscribe(data_=>{

                var data;
                try {
                    data=JSON.parse(data_['_body'])
                } catch (e) {
                    this.messages.add(MessagesDictionary.MSGKEY_PARSE_GENERIC_ERROR, 'danger')
                    reject(e.message);
                }

                try {
                    resolve(new DataModelConfiguration(data))
                } catch (e) {
                    this.messages.add(e, 'danger')
                    reject(e)
                }
            });
        });
    }
}