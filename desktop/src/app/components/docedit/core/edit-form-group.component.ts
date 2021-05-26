import { Component, Input } from '@angular/core';
import { Document, LabelUtil, FieldDefinition, RelationDefinition } from 'idai-field-core';


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


    public getLabel(object: FieldDefinition|RelationDefinition): string {

        return LabelUtil.getLabel(object);
    }


    public getDescription(field: FieldDefinition): string|undefined {

        return LabelUtil.getTranslation(field.description);
    }


    public shouldShow(field: FieldDefinition): boolean {

        return field !== undefined && field.editable === true;
    }
}
