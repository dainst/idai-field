import {Input, Component, OnChanges, SimpleChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import { FieldDocument } from 'idai-field-core';

@Component({
    selector: 'type-grid-element',
    templateUrl: './type-grid-element.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class TypeGridElementComponent {

    @Input() document: FieldDocument;
    @Input() images: Array<SafeResourceUrl>;
    @Input() subtype?: FieldDocument;

    constructor() {}
}
