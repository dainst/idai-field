import { Component, Input } from '@angular/core';
import { Resource } from 'idai-field-core';
import { Language } from '../../../../services/languages';


@Component({
    selector: 'form-field-input',
    templateUrl: './input.html'
})

/**
 * @author Thomas Kleinke
 */
export class InputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;
    @Input() languages: Array<Language>;
    @Input() multiLine: boolean;


    public update(fieldData: any) {

        if (fieldData) {
            this.resource[this.fieldName] = fieldData;
        } else {
            delete this.resource[this.fieldName];
        }
    }
}
