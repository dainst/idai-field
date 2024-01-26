import { Component, Input } from '@angular/core';


@Component({
    selector: 'form-field-simple-input',
    template: `<input [(ngModel)]="fieldContainer[fieldName]" (keyup)="deleteIfEmpty($event.target.value)"
                      class="form-control">`
})

/**
 * @author Fabian Zav.
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class SimpleInputComponent {

    @Input() fieldContainer: any;
    @Input() fieldName: string;


    public deleteIfEmpty(value: string) {

        if (value === '') delete this.fieldContainer[this.fieldName];
    }
}
