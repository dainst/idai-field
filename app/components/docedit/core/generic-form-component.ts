import {Component, Input} from '@angular/core';
import {Document, FieldDefinition, RelationDefinition} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'generic-form',
    templateUrl: './generic-form.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class GenericFormComponent {

    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() document: Document;


    public shouldShow(field: any) {

        if (!field) return false;
        if (field.name === 'identifier' || field.name === 'shortDescription') return true;

        return field.editable && field.visible;
    }
}