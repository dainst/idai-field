import {Component, OnChanges, Input, Output, EventEmitter} from "@angular/core";
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
    @Output() onEditGeometry: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onCreatePoint: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onCreatePolygon: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onCreatePolyline: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    constructor(
        private router: Router
    ) { }

    ngOnChanges() {
        if (!this.document) return;
        var resource:IdaiFieldResource = this.document.resource;
    }
}