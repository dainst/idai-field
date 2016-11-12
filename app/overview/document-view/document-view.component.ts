import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldResource} from "../../model/idai-field-resource";
import {ConfigLoader, ReadDatastore} from "idai-components-2/idai-components-2";


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

    constructor(
        private router: Router
    ) { }

    ngOnChanges() {
        if (!this.document) return;
        var resource:IdaiFieldResource = this.document.resource;
    }

    public selectDocument(documentToJumpTo) {
        this.router.navigate(['resources',{ id: documentToJumpTo.resource.id }])
    }
}