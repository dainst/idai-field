import { Component, Input } from '@angular/core';


@Component({
    selector: 'form-field-boolean',
    templateUrl: './boolean.html'
})

/**
 * @author Sebastian Cuy
 */
export class BooleanComponent {

    @Input() fieldContainer: any;
    @Input() fieldName: string;


    constructor() {}


    public setValue(value: any) {

        this.fieldContainer[this.fieldName] = value;
    }


    public resetValue() {

        delete this.fieldContainer[this.fieldName];
    }
}
