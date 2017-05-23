import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument, IdaiFieldResource} from 'idai-components-2/idai-field-model';


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