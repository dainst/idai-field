import {Component, OnChanges, Input, Output, EventEmitter} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ConfigLoader} from "idai-components-2/configuration";

@Component({
    selector: 'document-view',
    moduleId: module.id,
    templateUrl: './document-view.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class DocumentViewComponent implements OnChanges {

    @Input() document: any;
    @Input() basePath: string;

    private typeLabel;

    constructor(
        private router: Router,
        private configLoader: ConfigLoader
    ) {

    }

    ngOnChanges() {
        if (!this.document) return;
        this.configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.typeLabel = projectConfiguration.getLabelForType(this.document.resource.type)
        });
        var resource:IdaiFieldResource = this.document.resource;
    }
}