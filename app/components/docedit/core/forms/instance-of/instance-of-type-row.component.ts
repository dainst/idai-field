import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {FieldDocument} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-instance-of-type-row',
    templateUrl: './instance-of-type-row.html'
})
/**
 * @author Daniel de Oliveira
 */
export class InstanceOfTypeRowComponent {

    @ViewChild('typeRow', { static: false }) typeRowElement: ElementRef;

    @Input() document: FieldDocument;
    @Input() imageIds: string[]
}