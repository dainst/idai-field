import {Injectable} from "@angular/core";
import {ProjectConfiguration} from "./project-configuration";
import {Messages} from "./messages";
import {Http} from "@angular/http";
import {M} from "../m";


/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class ConfigLoader {

    private static PROJECT_CONFIGURATION_PATH='config/Configuration.json';
    
    constructor(
        private http: Http,
        private messages: Messages){
    }

    public getProjectConfiguration() : Promise<ProjectConfiguration> {

        return new Promise<ProjectConfiguration>((resolve, reject) => {
            this.http.get(ConfigLoader.PROJECT_CONFIGURATION_PATH).
            subscribe(data_=>{

                var data;
                try {
                    data=JSON.parse(data_['_body'])
                } catch (e) {
                    this.messages.add(M.PARSE_GENERIC_ERROR)
                    reject(e.message);
                }

                try {
                    resolve(new ProjectConfiguration(data))
                } catch (e) {
                    this.messages.add(e)
                    reject(e)
                }
            });
        });
    }
}