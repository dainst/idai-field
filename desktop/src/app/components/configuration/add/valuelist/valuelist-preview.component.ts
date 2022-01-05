import { Component, Input } from '@angular/core';
import { Valuelist } from 'idai-field-core';


@Component({
    selector: 'valuelist-preview',
    templateUrl: './valuelist-preview.html'
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistPreviewComponent {

    @Input() valuelist: Valuelist|undefined;


    constructor() {}
}
