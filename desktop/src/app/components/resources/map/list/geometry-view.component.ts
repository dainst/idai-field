import {Component, Input, Output, EventEmitter} from '@angular/core';
import {FieldDocument} from 'idai-field-core';


@Component({
    selector: 'geometry-view',
    templateUrl: './geometry-view.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GeometryViewComponent {

    @Input() document: FieldDocument;
    @Output() onCreateGeometry: EventEmitter<string> = new EventEmitter<string>();
    @Output() onEditGeometry: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();
}
