import { Input, Component } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { FieldDocument } from 'idai-field-core';


@Component({
    selector: 'grid-item',
    templateUrl: './grid-item.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GridItemComponent {

    @Input() document: FieldDocument;
    @Input() images: Array<SafeResourceUrl>;
    @Input() subtype?: FieldDocument;

    constructor() {}
}
