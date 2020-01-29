import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-type-row',
    templateUrl: './type-row.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRowComponent {

    @Input() document: FieldDocument;
    @Input() imageIds: string[]
}