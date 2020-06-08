import {Input, Component, ChangeDetectionStrategy} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'type-grid-element',
    templateUrl: './type-grid-element.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class TypeGridElementComponent {

    @Input() document: FieldDocument;
    @Input() subtype?: FieldDocument;
    @Input() imageUrls: Array<SafeResourceUrl>;

}
