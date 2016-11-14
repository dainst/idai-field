import {Injectable} from "@angular/core";
import {M} from "./m";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {ProjectConfiguration} from "../node_modules/idai-components-2/idai-components-2";
import {Observable} from "rxjs/Observable";


@Injectable()
export class ConfigurationValidator {

    private observers = [];

    private projectConfig: ProjectConfiguration = undefined;

    private errors = [];

    private valid = undefined;

    constructor(private configLoader: ConfigLoader) { }

    public validation() : Observable<any> {
        if (this.valid == undefined) {
            this.configLoader.configuration().subscribe(result => {
                if (!result.error) {
                    this.validate(result.projectConfiguration)
                }
            });
        }
        
        return Observable.create( observer => {
            this.observers.push(observer);
            this.notify();
        });
    }

    private notify() {
        if (!this.projectConfig && this.errors.length == 0) return;
        this.observers.forEach(observer => {
            observer.next({
                isValid: this.valid,
                errors: this.errors
            });
        });
    }
    
    private validate(projectConfiguration: ProjectConfiguration) {
        this.projectConfig = projectConfiguration;
        
        if(!this.projectConfig.getTypesMap()["image"]) {
            this.errors.push(M.CONFIG_VALIDATION_IMAGE_MISSING);
        }

        if (this.errors.length > 0) {this.valid = false;} else {this.valid = true;}

        this.notify();
    }
}
