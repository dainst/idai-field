import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {WithConfiguration} from "../util/with-configuration";

@Component({
    selector: 'plus-button',
    moduleId: module.id,
    templateUrl: './plus-button.html'
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PlusButtonComponent extends WithConfiguration {

    private type: string;

    constructor(
        private router: Router,
        configLoader: ConfigLoader)
    {
        super(configLoader);
    }

    public startDocumentCreation(geometryType: string) {

        if (geometryType == "none") {
            this.router.navigate(['resources/new', { type: this.type }]);
        } else {
            this.router.navigate(['resources/editGeometry', 'new:' + this.type, geometryType]);
        }
    }
    
    public reset() {

        this.type = undefined;
    }
}
