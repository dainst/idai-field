import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {ConfigLoader, IdaiType, ProjectConfiguration} from "idai-components-2/configuration";

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

    private typesTreeList: IdaiType[];
    private type: string;

    constructor(
        private router: Router,
        configLoader: ConfigLoader)
    {
        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.initializeTypesTreeList(projectConfiguration);
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

    private initializeTypesTreeList(projectConfiguration: ProjectConfiguration) {

        this.typesTreeList = [];

        for (var type of projectConfiguration.getTypesTreeList()) {
            if (type.name != "image") {
                this.typesTreeList.push(type);
            }
        }
    }
}
