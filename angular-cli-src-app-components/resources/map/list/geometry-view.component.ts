import {Component, Input, Output, EventEmitter} from '@angular/core';
import {FieldDocument} from 'idai-components-2';


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

    @Input() document: FieldDocument;
    @Output() onCreateGeometry: EventEmitter<string> = new EventEmitter<string>();
    @Output() onEditGeometry: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();
}