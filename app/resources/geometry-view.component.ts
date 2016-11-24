import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldResource} from "../model/idai-field-resource";


@Component({
    selector: 'geometry-view',
    moduleId: module.id,
    templateUrl: './geometry-view.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GeometryViewComponent implements OnChanges {

    @Input() document: IdaiFieldDocument;

    constructor(
        private router: Router
    ) { }

    ngOnChanges() {
        if (!this.document) return;
        var resource:IdaiFieldResource = this.document.resource;
    }
}