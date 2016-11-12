import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {ConfigLoader, ProjectConfiguration} from "idai-components-2/idai-components-2";

@Component({
    selector: 'plus-button',
    moduleId: module.id,
    templateUrl: './plus-button.html'
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PlusButtonComponent {

    private projectConfiguration: ProjectConfiguration;
    private type: string;

    constructor(
        private router: Router,
        private configLoader: ConfigLoader)
    {
        this.configLoader.configuration().subscribe(result => {
            this.projectConfiguration = result.projectConfiguration;
        });
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
