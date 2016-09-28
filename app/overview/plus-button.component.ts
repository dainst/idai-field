import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {OverviewComponent} from "./overview.component";

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

    private projectConfiguration;
    private type: string;

    constructor(
        private router: Router,
        private configLoader: ConfigLoader,
        private overviewComponent: OverviewComponent)
    {
        this.configLoader.configuration().subscribe(result => {
            this.projectConfiguration = result.projectConfiguration;
        });
    }

    public startDocumentCreation(geometryType: string) {

        this.overviewComponent.createNewDocument(this.type);

        if (geometryType == "none") {
            this.router.navigate(['resources', 'new', 'edit']);
        } else {
            this.router.navigate(['resources/editGeometry', geometryType, 'new']);
        }
    }
    
    public reset() {

        this.type = undefined;
    }
}
