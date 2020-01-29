import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-type-row',
    templateUrl: './type-row.html'
})
/**
 * TODO show type foto on the left side
 *
 * @author Daniel de Oliveira
 */
export class TypeRowComponent {

    @Input() document: FieldDocument;
    @Input() imageIds: string[];
}