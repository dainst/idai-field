import { Component, Input } from '@angular/core';
import { Resource } from 'idai-field-core';


@Component({
    selector: 'dai-input',
    templateUrl: './input.html'
})

/**
 * @author Thomas Kleinke
 */
export class InputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;


    public update(fieldData: any) {

        if (fieldData) {
            this.resource[this.fieldName] = fieldData;
        } else {
            delete this.resource[this.fieldName];
        }
    }
}
