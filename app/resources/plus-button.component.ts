import {Component, ElementRef, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {ConfigLoader, IdaiType, ProjectConfiguration} from "idai-components-2/configuration";
import {ResourcesComponent} from './resources.component';


@Component({
    selector: 'plus-button',
    moduleId: module.id,
    templateUrl: './plus-button.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PlusButtonComponent {

    private typesTreeList: IdaiType[];
    private type: string;
    @ViewChild('p') private popover;

    constructor(
        private elementRef: ElementRef,
        private router: Router,
        private resourcesComponent: ResourcesComponent,

        configLoader: ConfigLoader)
    {
        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.initializeTypesTreeList(projectConfiguration);
        });
    }

    public startDocumentCreation(geometryType: string) {

        this.resourcesComponent.createNewDocument(this.type, geometryType);
    }

    public reset() {

        this.type = undefined;
    }

    private handleClick(event) {
        if (!this.popover) return;
        var target = event.target;
        var inside = false;
        do {
            if (target === this.elementRef.nativeElement
                || target.id === 'new-object-menu'
                || target.id === 'geometry-type-selection') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);
        if (!inside) {
            this.popover.close();
        }
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
