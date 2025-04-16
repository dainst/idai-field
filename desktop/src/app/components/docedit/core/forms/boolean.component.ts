import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
    selector: 'form-field-boolean',
    templateUrl: './boolean.html',
    standalone: false
})

/**
 * @author Sebastian Cuy
 */
export class BooleanComponent {

    @Input() fieldContainer: any;
    @Input() fieldName: string;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();


    constructor() {}


    public setValue(value: any) {

        this.fieldContainer[this.fieldName] = value;
        this.onChanged.emit();
    }


    public resetValue() {

        delete this.fieldContainer[this.fieldName];
        this.onChanged.emit();
    }
}
