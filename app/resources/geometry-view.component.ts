import {Component, Input, Output, EventEmitter} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


@Component({
    selector: 'geometry-view',
    moduleId: module.id,
    templateUrl: './geometry-view.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GeometryViewComponent {

    @Input() document: IdaiFieldDocument;
    @Output() onCreateGeometry: EventEmitter<string> = new EventEmitter<string>();
    @Output() onEditGeometry: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

}