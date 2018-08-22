import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    selector: 'dai-input',
    template: `<input [(ngModel)]="resource[fieldName]"  class="form-control">`
})

/**
 * @author Fabian Zav.
 * @author Sebastian Cuy
 */
export class InputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;
}