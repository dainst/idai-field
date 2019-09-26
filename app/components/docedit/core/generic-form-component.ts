import {Component, Input} from '@angular/core';
import {Document} from 'idai-components-2';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';


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