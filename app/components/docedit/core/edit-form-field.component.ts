import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {FieldDefinition} from 'idai-components-2';


@Component({
    moduleId: module.id,
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