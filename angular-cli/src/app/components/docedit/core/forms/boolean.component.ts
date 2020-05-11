import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-boolean',
    templateUrl: './boolean.html'
})

/**
 * @author Sebastian Cuy
 */
export class BooleanComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;


    constructor() {}


    public setValue(value: any) {

        this.resource[this.fieldName] = value;
    }


    public resetValue() {

        delete this.resource[this.fieldName];
    }
}