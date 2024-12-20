import { Component, Input } from '@angular/core';


@Component({
    selector: 'form-field-simple-input',
    template: `<input [(ngModel)]="fieldContainer[fieldName]" (input)="deleteIfEmpty()"
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


    public deleteIfEmpty() {

        if (this.fieldContainer[this.fieldName] === '') delete this.fieldContainer[this.fieldName];
    }
}
