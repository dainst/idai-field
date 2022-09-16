import { Component, Input } from '@angular/core';
import { Resource } from 'idai-field-core';


@Component({
    selector: 'form-field-simple-input',
    template: `<input [(ngModel)]="resource[fieldName]" (keyup)="deleteIfEmpty($event.target.value)"
                      class="form-control">`
})

/**
 * @author Fabian Zav.
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class SimpleInputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;


    public deleteIfEmpty(value: string) {

        if (value === '') delete this.resource[this.fieldName];
    }
}
