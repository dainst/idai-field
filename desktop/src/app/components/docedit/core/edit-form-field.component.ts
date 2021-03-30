import {Component, Input} from '@angular/core';
import {Resource} from 'idai-field-core';
import {FieldDefinition} from 'idai-field-core';


@Component({
    selector: 'edit-form-field',
    templateUrl: './edit-form-field.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class EditFormFieldComponent {

    @Input() resource: Resource;
    @Input() field: FieldDefinition;
}
