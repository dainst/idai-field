import {Component, OnChanges, Input, Output, EventEmitter} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {WithConfiguration} from "../util/with-configuration";

@Component({
    selector: 'document-view',
    moduleId: module.id,
    templateUrl: './document-view.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class DocumentViewComponent extends WithConfiguration implements OnChanges {

    @Input() document: any;
    @Input() basePath: string;
    @Output() relationClicked = new EventEmitter();

    constructor(
        private router: Router,
        configLoader: ConfigLoader
    ) {
        super(configLoader);
    }

    ngOnChanges() {
        if (!this.document) return;
        var resource:IdaiFieldResource = this.document.resource;
    }

    public onRelationClicked(docToJumpTo) {
        this.relationClicked.emit(docToJumpTo);
    }
}