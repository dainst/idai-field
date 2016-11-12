import {Component, OnChanges, Input, Output, EventEmitter} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ConfigLoader, ReadDatastore, ProjectConfiguration} from "idai-components-2/idai-components-2";


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
    @Output() relationClicked = new EventEmitter();

    private projectConfiguration: ProjectConfiguration;

    constructor(
        private router: Router,
        private configLoader: ConfigLoader
    ) {
        this.configLoader.configuration().subscribe((result) => {
            if (!result.error) {
                this.projectConfiguration = result.projectConfiguration;
            }
        });
    }

    ngOnChanges() {
        if (!this.document) return;
        var resource:IdaiFieldResource = this.document.resource;
    }

    public onRelationClicked(docToJumpTo) {
        this.relationClicked.emit(docToJumpTo);
    }
}