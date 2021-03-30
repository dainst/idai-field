import {Component, Input} from '@angular/core';
import {Document} from 'idai-field-core';
import {FieldDefinition, RelationDefinition} from 'idai-field-core';


@Component({
    selector: 'edit-form-group',
    templateUrl: './edit-form-group.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormGroup {

    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() document: Document;


    public shouldShow(field: FieldDefinition): boolean {

        return field !== undefined && field.editable === true;
    }
}
